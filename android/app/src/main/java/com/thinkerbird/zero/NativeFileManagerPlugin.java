package com.thinkerbird.zero;

import android.app.DownloadManager;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import androidx.core.content.ContextCompat;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Native Android plugin for:
 * 1. Streaming large files to device storage in small chunks without OOM crashes.
 * 2. Opening the system Downloads folder when a notification is tapped.
 */
@CapacitorPlugin(name = "NativeFileManager")
public class NativeFileManagerPlugin extends Plugin {

    private static final int STREAM_BUFFER_BYTES = 64 * 1024;
    private final Map<String, PendingSave> activeSaves = new ConcurrentHashMap<>();
    private final ExecutorService ioExecutor = Executors.newSingleThreadExecutor();

    private static final class PendingSave {
        final OutputStream outputStream;
        final Uri mediaUri;
        final File diskFile;
        final String filename;
        final boolean isMediaStore;

        PendingSave(OutputStream outputStream, Uri mediaUri, File diskFile, String filename, boolean isMediaStore) {
            this.outputStream = outputStream;
            this.mediaUri = mediaUri;
            this.diskFile = diskFile;
            this.filename = filename;
            this.isMediaStore = isMediaStore;
        }
    }

    private static String sanitizeName(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            return "file.bin";
        }
        String cleaned = raw.replace('\0', '_').replaceAll("[/\\\\?%*:|\"<>]", "_").trim();
        while (cleaned.startsWith(".")) {
            cleaned = cleaned.substring(1).trim();
        }
        return cleaned.isEmpty() ? "file.bin" : cleaned;
    }

    private static File createUniqueFile(File directory, String filename) {
        File candidate = new File(directory, filename);
        if (!candidate.exists()) {
            return candidate;
        }
        int dot = filename.lastIndexOf('.');
        String stem = dot > 0 ? filename.substring(0, dot) : filename;
        String ext = dot > 0 ? filename.substring(dot) : "";
        for (int i = 1; i < 10000; i++) {
            File next = new File(directory, stem + " (" + i + ")" + ext);
            if (!next.exists()) {
                return next;
            }
        }
        return new File(directory, stem + "-" + UUID.randomUUID().toString().substring(0, 8) + ext);
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        try {
            Context ctx = getContext();
            if (ctx != null) {
                ctx.stopService(new Intent(ctx, ZeroBackgroundService.class));
            }
        } catch (Exception ignored) {
        }
        for (Map.Entry<String, PendingSave> entry : activeSaves.entrySet()) {
            cleanupPendingSave(entry.getValue(), true);
        }
        activeSaves.clear();
        ioExecutor.shutdownNow();
    }

    private void cleanupPendingSave(PendingSave pending, boolean deleteIncomplete) {
        if (pending == null) return;
        try {
            pending.outputStream.close();
        } catch (IOException ignored) {
        }
        if (deleteIncomplete) {
            if (pending.isMediaStore && pending.mediaUri != null) {
                try {
                    getContext().getContentResolver().delete(pending.mediaUri, null, null);
                } catch (Exception ignored) {
                }
            } else if (pending.diskFile != null && pending.diskFile.exists()) {
                //noinspection ResultOfMethodCallIgnored
                pending.diskFile.delete();
            }
        }
    }

    private PendingSave openMediaStoreSave(Uri collection, String relativePath, String filename, String mimeType) throws IOException {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            throw new IOException("MediaStore RELATIVE_PATH requires API 29+");
        }
        ContentResolver resolver = getContext().getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
        values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
        values.put(MediaStore.MediaColumns.RELATIVE_PATH, relativePath);
        values.put(MediaStore.MediaColumns.IS_PENDING, 1);

        Uri itemUri = resolver.insert(collection, values);
        if (itemUri == null) {
            throw new IOException("MediaStore insert returned null");
        }
        OutputStream rawStream = resolver.openOutputStream(itemUri, "w");
        if (rawStream == null) {
            try {
                resolver.delete(itemUri, null, null);
            } catch (Exception ignored) {
            }
            throw new IOException("Unable to open MediaStore output stream");
        }
        return new PendingSave(new BufferedOutputStream(rawStream, STREAM_BUFFER_BYTES), itemUri, null, filename, true);
    }

    private PendingSave openDiskSave(String filename) throws IOException {
        File docsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS);
        if (docsDir != null && (docsDir.exists() || docsDir.mkdirs()) && docsDir.canWrite()) {
            File target = createUniqueFile(docsDir, filename);
            OutputStream stream = new BufferedOutputStream(new FileOutputStream(target, false), STREAM_BUFFER_BYTES);
            return new PendingSave(stream, Uri.fromFile(target), target, target.getName(), false);
        }
        File appDir = getContext().getFilesDir();
        if (appDir != null && (appDir.exists() || appDir.mkdirs())) {
            File target = createUniqueFile(appDir, filename);
            OutputStream stream = new BufferedOutputStream(new FileOutputStream(target, false), STREAM_BUFFER_BYTES);
            return new PendingSave(stream, Uri.fromFile(target), target, target.getName(), false);
        }
        throw new IOException("No writable storage directory available");
    }

    @PluginMethod
    public void beginSaveFile(PluginCall call) {
        final String rawFilename = call.getString("filename", "file.bin");
        final String mimeType = call.getString("mimeType", "application/octet-stream");
        final String filename = sanitizeName(rawFilename);

        ioExecutor.execute(() -> {
            try {
                PendingSave pending = null;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    try {
                        Uri docsCollection = MediaStore.Files.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
                        pending = openMediaStoreSave(docsCollection, Environment.DIRECTORY_DOCUMENTS, filename, mimeType);
                    } catch (Exception docsEx) {
                        try {
                            pending = openMediaStoreSave(MediaStore.Downloads.EXTERNAL_CONTENT_URI, Environment.DIRECTORY_DOWNLOADS, filename, mimeType);
                        } catch (Exception dlEx) {
                            pending = openDiskSave(filename);
                        }
                    }
                } else {
                    pending = openDiskSave(filename);
                }

                String streamId = UUID.randomUUID().toString();
                activeSaves.put(streamId, pending);

                JSObject result = new JSObject();
                result.put("streamId", streamId);
                result.put("filename", pending.filename);
                call.resolve(result);
            } catch (Exception ex) {
                call.reject("Unable to start file save: " + ex.getMessage());
            }
        });
    }

    @PluginMethod
    public void writeSaveChunk(PluginCall call) {
        final String streamId = call.getString("streamId");
        final String base64Chunk = call.getString("data");
        if (streamId == null || base64Chunk == null) {
            call.reject("Missing streamId or data");
            return;
        }

        final PendingSave pending = activeSaves.get(streamId);
        if (pending == null) {
            call.reject("Invalid or closed save stream");
            return;
        }

        ioExecutor.execute(() -> {
            try {
                if (!base64Chunk.isEmpty()) {
                    byte[] decoded = Base64.decode(base64Chunk, Base64.DEFAULT);
                    pending.outputStream.write(decoded);
                }
                call.resolve();
            } catch (Exception ex) {
                activeSaves.remove(streamId);
                cleanupPendingSave(pending, true);
                call.reject("Failed writing file chunk: " + ex.getMessage());
            }
        });
    }

    @PluginMethod
    public void finishSaveFile(PluginCall call) {
        final String streamId = call.getString("streamId");
        if (streamId == null) {
            call.reject("Missing streamId");
            return;
        }

        final PendingSave pending = activeSaves.remove(streamId);
        if (pending == null) {
            call.reject("Invalid or already finished save stream");
            return;
        }

        ioExecutor.execute(() -> {
            try {
                pending.outputStream.flush();
                pending.outputStream.close();

                if (pending.isMediaStore && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && pending.mediaUri != null) {
                    ContentValues doneValues = new ContentValues();
                    doneValues.put(MediaStore.MediaColumns.IS_PENDING, 0);
                    getContext().getContentResolver().update(pending.mediaUri, doneValues, null, null);
                } else if (pending.diskFile != null) {
                    MediaScannerConnection.scanFile(
                        getContext(),
                        new String[] { pending.diskFile.getAbsolutePath() },
                        null,
                        null
                    );
                }

                JSObject result = new JSObject();
                result.put("uri", pending.mediaUri != null ? pending.mediaUri.toString() : "");
                result.put("filename", pending.filename);
                call.resolve(result);
            } catch (Exception ex) {
                cleanupPendingSave(pending, true);
                call.reject("Failed finalizing saved file: " + ex.getMessage());
            }
        });
    }

    @PluginMethod
    public void abortSaveFile(PluginCall call) {
        final String streamId = call.getString("streamId");
        if (streamId != null) {
            final PendingSave pending = activeSaves.remove(streamId);
            if (pending != null) {
                ioExecutor.execute(() -> cleanupPendingSave(pending, true));
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void startBackgroundTask(PluginCall call) {
        final String mode = call.getString("mode", "encrypt");
        try {
            Context ctx = getContext();
            Intent intent = new Intent(ctx, ZeroBackgroundService.class);
            intent.setAction(ZeroBackgroundService.ACTION_START);
            intent.putExtra(ZeroBackgroundService.EXTRA_MODE, mode);
            ContextCompat.startForegroundService(ctx, intent);
            call.resolve();
        } catch (Exception ex) {
            // Do not fail encryption/decryption if OEM denies foreground service start; resolve gracefully.
            call.resolve();
        }
    }

    @PluginMethod
    public void stopBackgroundTask(PluginCall call) {
        try {
            Context ctx = getContext();
            Intent stopIntent = new Intent(ctx, ZeroBackgroundService.class);
            stopIntent.setAction(ZeroBackgroundService.ACTION_STOP);
            ctx.stopService(stopIntent);
        } catch (Exception ignored) {
        }
        call.resolve();
    }

    @PluginMethod
    public void openDownloads(PluginCall call) {
        try {
            // Primary intent: android.intent.action.VIEW_DOWNLOADS
            Intent intent = new Intent(DownloadManager.ACTION_VIEW_DOWNLOADS);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception primaryEx) {
            try {
                // Secondary fallback: open system file manager targeting external downloads
                Intent fallback = new Intent(Intent.ACTION_VIEW);
                Uri uri = Uri.parse(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS).getPath());
                fallback.setDataAndType(uri, "*/*");
                fallback.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                getContext().startActivity(fallback);
                call.resolve();
            } catch (Exception secondaryEx) {
                try {
                    // Third fallback: generic GET_CONTENT or files app
                    Intent chooser = new Intent(Intent.ACTION_GET_CONTENT);
                    chooser.setType("*/*");
                    chooser.addCategory(Intent.CATEGORY_OPENABLE);
                    chooser.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(chooser);
                    call.resolve();
                } catch (Exception finalEx) {
                    call.reject("Unable to open Downloads or file manager: " + finalEx.getMessage());
                }
            }
        }
    }
}
