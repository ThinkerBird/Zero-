package com.thinkerbird.zero;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

/**
 * Foreground service that keeps WebView cryptographic processing and chunked storage
 * writes running reliably while the user has minimized the app or turned off the screen.
 * Security guarantee: Never includes filenames, keys, or passwords in notifications.
 */
public class ZeroBackgroundService extends Service {

    public static final String ACTION_START = "com.thinkerbird.zero.action.START_BG_PROCESSING";
    public static final String ACTION_STOP = "com.thinkerbird.zero.action.STOP_BG_PROCESSING";
    public static final String EXTRA_MODE = "mode";

    private static final String CHANNEL_ID = "zero_background_processing";
    private static final int NOTIFICATION_ID = 4102;
    private static final long WAKELOCK_TIMEOUT_MS = 30L * 60L * 1000L; // 30 minutes safety cap

    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate() {
        super.onCreate();
        ensureChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopServiceCleanly();
            return START_NOT_STICKY;
        }

        String mode = intent != null ? intent.getStringExtra(EXTRA_MODE) : null;
        Notification notification = buildNotification(mode);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }

        acquireWakeLock();
        return START_NOT_STICKY;
    }

    @Override
    public void onTimeout(int startId) {
        stopServiceCleanly();
    }

    @Override
    public void onTimeout(int startId, int fgsType) {
        stopServiceCleanly();
    }

    @Override
    public void onDestroy() {
        releaseWakeLock();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void ensureChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null && manager.getNotificationChannel(CHANNEL_ID) == null) {
                NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Background File Processing",
                    NotificationManager.IMPORTANCE_LOW
                );
                channel.setDescription("Keeps encryption, decryption, and storage writes active when minimized.");
                channel.setShowBadge(false);
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildNotification(String mode) {
        String contentText = "decrypt".equals(mode)
            ? "Decrypting and saving files in background..."
            : "Encrypting and saving files in background...";

        Intent launchIntent = new Intent(this, MainActivity.class);
        launchIntent.setAction(Intent.ACTION_MAIN);
        launchIntent.addCategory(Intent.CATEGORY_LAUNCHER);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        PendingIntent contentIntent = PendingIntent.getActivity(this, 0, launchIntent, pendingFlags);

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(this, CHANNEL_ID)
            : new Notification.Builder(this);

        builder
            .setContentTitle("Zero — Processing in background")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(contentIntent);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            builder.setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE);
        }

        return builder.build();
    }

    private void acquireWakeLock() {
        try {
            if (wakeLock == null) {
                PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
                if (pm != null) {
                    wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Zero:BackgroundProcessing");
                    wakeLock.setReferenceCounted(false);
                }
            }
            if (wakeLock != null && !wakeLock.isHeld()) {
                wakeLock.acquire(WAKELOCK_TIMEOUT_MS);
            }
        } catch (Exception ignored) {
            // WakeLock is best-effort; foreground service still preserves process priority.
        }
    }

    private void releaseWakeLock() {
        try {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
            }
        } catch (Exception ignored) {
        }
    }

    private void stopServiceCleanly() {
        releaseWakeLock();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE);
        } else {
            //noinspection deprecation
            stopForeground(true);
        }
        stopSelf();
    }
}
