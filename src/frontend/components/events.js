function emitSidebarLinkEvent(memberStatus) {
  const sidebar = document.body.querySelector('.sidebar-container');
  const currentUrl = window.location.pathname;
  const sidebarLinkEvent = new CustomEvent('sidebar-link-change', {
    bubbles: true,
    cancelable: true,
    detail: {
      currentUrl,
      memberStatus,
    },
  });

  sidebar.dispatchEvent(sidebarLinkEvent);
}

function emitNewInboxMsgEvent(inbox, msg) {
  const newInboxMsgEvent = new CustomEvent('new-inbox-msg', {
    bubbles: true,
    cancelable: true,
    detail: {
      msg,
    }
  });

  inbox.dispatchEvent(newInboxMsgEvent);
}

function emitUpdateSearchbarEvent(searchbar) {
  const updateSearchBarEvent = new CustomEvent('update-searchbar', {
    bubbles: true,
    cancelable: true,
  });

  searchbar.dispatchEvent(updateSearchBarEvent);
}

function emitSetupSearchbarEvent(element) {
  const setupSearchBarEvent = new CustomEvent('setup-searchbar', {
    bubbles: true,
    cancelable: true,
  });

  element.dispatchEvent(setupSearchBarEvent);
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

    case '/members':
      const tribeChatMembersFocusEvent = new CustomEvent('focus-tribe-chat-members', {
        bubbles: true,
        cancelable: true,
        detail: {
          focus,
        },
      });

      element.dispatchEvent(tribeChatMembersFocusEvent);
      break;

    case '/notifications':
      const notificationsFocusEvent = new CustomEvent('focus-notifications', {
        bubbles: true,
        cancelable: true,
        detail: {
          focus,
        },
      });

      element.dispatchEvent(notificationsFocusEvent);
      break;

    default:
      break;
  }
}

export {
  emitSidebarLinkEvent,
  emitFocusEvent,
  emitNewInboxMsgEvent,
  emitSetupSearchbarEvent,
  emitUpdateSearchbarEvent,
}
