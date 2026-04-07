/**
 * Polyfill para CustomEvent no Node.js.
 * Necessário para compatibilidade com códigos que utilizam dispatchEvent e CustomEvent
 * em ambientes de servidor (ex: sub-agents ou bridges).
 */
if (typeof global.CustomEvent === 'undefined') {
  global.CustomEvent = class extends Event {
    constructor(event, params) {
      super(event, params);
      this.detail = params?.detail;
    }
  };
}

module.exports = global.CustomEvent;
