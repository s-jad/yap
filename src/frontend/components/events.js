function emitSidebarLinkEvent() {
  const sidebar = document.body.querySelector('.sidebar-container');
  const currentUrl = window.location.pathname;
  console.log("emitSidebarLinkEvent::currentUrl => ", currentUrl);
  const sidebarLinkEvent = new CustomEvent('sidebar-link-change', {
    bubbles: true,
    cancelable: true,
    detail: {
      currentUrl,
    },
  });

  sidebar.dispatchEvent(sidebarLinkEvent);
}

export {
  emitSidebarLinkEvent,
}
