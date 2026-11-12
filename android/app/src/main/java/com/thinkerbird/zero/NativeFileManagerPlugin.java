package com.thinkerbird.zero;

import android.app.DownloadManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Environment;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Native Android plugin to handle opening the system Downloads folder
 * via android.intent.action.VIEW_DOWNLOADS when a notification is tapped.
 */
@CapacitorPlugin(name = "NativeFileManager")
public class NativeFileManagerPlugin extends Plugin {

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
