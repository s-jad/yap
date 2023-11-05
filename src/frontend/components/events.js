function emitSidebarLinkEvent() {
  const sidebar = document.body.querySelector('.sidebar-container');
  const currentUrl = window.location.pathname;
  const sidebarLinkEvent = new CustomEvent('sidebar-link-change', {
    bubbles: true,
    cancelable: true,
    detail: {
      currentUrl,
    },
  });

  sidebar.dispatchEvent(sidebarLinkEvent);
}

function emitFocusEvent(page, element, focus) {
  
  switch (page) {
    case '/inbox':
      const inboxFocusEvent = new CustomEvent('focus-reply-msg', {
        bubbles: true,
        cancelable: true,
        detail: {
          focus,
        },
      });

      element.dispatchEvent(inboxFocusEvent);
      break;

    default:
      break;
  }
}

export {
  emitSidebarLinkEvent,
  emitFocusEvent,
}
