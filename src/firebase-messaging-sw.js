importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDYLndHvXt9uMaVzvNl3bO-CUaaF4rNt3s",
    authDomain: "myionicapp-363105.firebaseapp.com",
    projectId: "myionicapp-363105",
    storageBucket: "myionicapp-363105.appspot.com",
    messagingSenderId: "143485044140",
    appId: "1:143485044140:web:8ec0c966a40fce30472609",
    measurementId: "G-2WSF5G2R7K"
});


if (firebase.messaging.isSupported()) {
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage(function (payload) {
        updateEvent("DELIVERED", payload.data);
    });
    messaging.onMessage(function (payload) {
        console.log("Message SW ===== ", payload);
        //updateEvent("DELIVERED", payload.data);
    });
    
    async function updateEvent(status, data) {
        if (data && data.id && data.ref_id) {
            console.log("Notification Status Update = " + status, data);
            var url = 'https://jauhn517og.execute-api.us-east-1.amazonaws.com/dev/history/update-status'
            await fetch(url, {
                method: 'PUT',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: data.id,
                    ref_id: data.ref_id,
                    status: status
                })
            });
        }
    }
    // self.addEventListener('message', function (event) {
    //     console.log('SW: notification received', event);
    // });
    self.addEventListener('notificationclick', function (event) {
        console.log('SW: Clicked notification', event);
        const message = event.notification.data;
        updateEvent("VIEWED", message.data);
        event.notification.close();
        self.clients.openWindow((message.fcmOptions || {}).link || "/");
    });

    // self.addEventListener('push', event => {
    //     debugger;
    //     let data = {}
    //     if (event.data) {
    //         data = event.data.json();
    //     }
    //     console.log('SW: Push received', data);
    //     if (data.notification && data.notification.title) {
    //         self.registration.showNotification(data.notification.title, {
    //             body: data.notification.body,
    //             icon: data.notification.icon,
    //             image: data.notification.image,
    //             click_action: data.notification.click_action,
    //             data
    //         });
    //     } else {
    //         console.log('SW: No notification payload, not showing notification');
    //     }
    // })
}