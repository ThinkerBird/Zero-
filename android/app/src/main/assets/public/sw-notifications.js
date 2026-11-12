/**
 * Service Worker Notification Handler for Zero PWA
 *
 * NOTE ON BROWSER SANDBOX LIMITATION:
 * Web browsers and Progressive Web Apps (PWAs) cannot directly launch the native OS file manager
 * or open the device's Downloads folder due to browser security sandbox constraints.
 * Therefore, on notification click, we bring the active app window to focus (or launch it)
 * and dispatch an in-app notice instructing the user that the file has been saved to their Downloads folder.
 */

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickData = event.notification.data || {};

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and inform it of the notification tap
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'ZERO_NOTIFICATION_CLICK',
            action: event.action,
            title: event.notification.title,
            data: clickData,
          });
          return;
        }
      }
      // If no window is open, open the app with notification query flag
      if (self.clients.openWindow) {
        return self.clients.openWindow('/?from_notification=downloads');
      }
    })
  );
});
