import '@testing-library/jest-dom/vitest'

// jsdom doesn't implement scrollIntoView — MessagingPage.jsx calls it to
// auto-scroll to the latest message, which otherwise throws and aborts
// rendering entirely in any test that opens a conversation.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
