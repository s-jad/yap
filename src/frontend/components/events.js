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
  console.log("emitNewInboxMsgEvent::msg => ", msg);
  const newInboxMsgEvent = new CustomEvent('new-inbox-msg', {
    bubbles: true,
    cancelable: true,
    detail: {
      msg,
    }
  });

  inbox.dispatchEvent(newInboxMsgEvent);
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

    default:
      break;
  }
}

export {
  emitSidebarLinkEvent,
  emitFocusEvent,
  emitNewInboxMsgEvent,
}
