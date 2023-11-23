export default function Notification(type, message) {
	const notification = document.createElement("div");
	notification.classList.add("notification");
	notification.classList.add(`notification-${type}`);
	notification.innerHTML = `<p>${message}</p>`;
	document.body.appendChild(notification);

	// Move the notification up if there are other notifications
	const notifications = document.getElementsByClassName("notification");
	for (let i = 0; i < notifications.length; i++) {
		notifications[i].style.marginBottom = `${80 * i}px`;
	}

	setTimeout(() => {
		// Move all notifications up
		const notifications = document.getElementsByClassName("notification");
		for (let i = 0; i < notifications.length; i++) {
			notifications[i].style.marginBottom = `${80 * (i - 1)}px`;
		}
		notification.remove();
	}, 5000);
}