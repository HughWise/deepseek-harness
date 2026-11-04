/**
 * Browser half of the message-action plugin: one example button inside the
 * action strip of every finalized user message and of the assistant message
 * that closes a Turn.
 *
 * Both seats deliver the durable `messageId` and the `text` the built-in copy
 * control writes, so an action never has to re-derive the message body:
 *   - 'conversation.chat.user-actions'      (declared by the ui-chat `user` node)
 *   - 'conversation.chat.assistant-actions' (declared by the ui-chat Turn tail)
 *
 * The shipped copy control copies the text verbatim, so this example copies a
 * Markdown blockquote instead; `asQuote` below is the one place to change the
 * payload. Icon sizing and hover styling mirror the row's built-in controls
 * without importing the Chat package's private CSS Module.
 */
window.__ModuleLoader__.load({
  id: '@example/dsh-message-actions',
  factory(require) {
    const React = require('react')
    const {
      IconCheckOutlineRegular, IconDeliverDocRegular, Tooltip, useClipboardCopy,
    } = require('@deepseek-ai/dsh-client-ui-primitives')

    const h = React.createElement

    /** Copy namespace and plugin identity. */
    const NS = 'messageActions'
    const ID = '@example/dsh-message-actions'

    const zh = {
      'action.quote': '复制为引用',
      'action.copied': '已复制引用',
    }
    const en = {
      'action.quote': 'Copy as quote',
      'action.copied': 'Quote copied',
    }

    /** Quote each line so the clipboard holds a Markdown blockquote. */
    function asQuote(text) {
      return text.split('\n').map(line => (line === '' ? '>' : `> ${line}`)).join('\n')
    }

    /** One message's quote action, seated after the built-in copy control. */
    function QuoteAction({ text, t }) {
      // The shared hook owns the clipboard write, its success reset, and cleanup.
      const { copied, onCopy } = useClipboardCopy(asQuote(text))
      const label = copied ? t('action.copied') : t('action.quote')
      return h(Tooltip, { label, side: 'bottom' },
        h('button', {
          type: 'button',
          className: 'dsw-msg-action',
          'aria-label': label,
          onClick: onCopy,
        }, copied ? h(IconCheckOutlineRegular) : h(IconDeliverDocRegular)))
    }

    /** The scoped sheet, appended while the plugin lives. */
    const CSS = [
      '.dsw-msg-action { display: inline-flex; align-items: center; justify-content: center;',
      ' width: calc(28px + var(--dsh-content-font-delta, 0px)); height: calc(28px + var(--dsh-content-font-delta, 0px));',
      ' padding: 6px; border: none; border-radius: var(--dsw-radius-sm); background: transparent;',
      ' color: var(--dsw-alias-label-tertiary); cursor: pointer; }',
      '.dsw-msg-action svg { width: calc(15px + var(--dsh-content-font-delta, 0px)); height: calc(15px + var(--dsh-content-font-delta, 0px)); }',
      "[data-clock='end'] .dsw-msg-action svg { width: calc(17px + var(--dsh-content-font-delta, 0px)); height: calc(17px + var(--dsh-content-font-delta, 0px)); }",
      '@media (hover: hover) { .dsw-msg-action:hover {',
      ' background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-secondary); } }',
    ].join('')

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'message-actions: dictionaries')
        ctx.effect(() => {
          const style = document.createElement('style')
          style.dataset.plugin = ID
          style.textContent = CSS
          document.head.append(style)
          return () => { style.remove() }
        }, 'message-actions: sheet')
        // One contribution per seat: the two lists are independent, so the same
        // component mounts on the user row and on the Turn-closing reply.
        for (const [seat, label] of [
          ['conversation.chat.user-actions', 'user row'],
          ['conversation.chat.assistant-actions', 'assistant row'],
        ]) {
          ctx.effect(() => ctx.slots.inject(seat, () => ctx.slots.register({
            name: seat,
            id: 'quote',
            order: 20,
            locale: NS,
          }, QuoteAction)), `message-actions: quote on the ${label}`)
        }
      },
    }
  },
})
