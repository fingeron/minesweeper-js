(function(global) {
    
    class EventEmitter {
        constructor() {
            this.listeners = [];
        }

        subscribe(listener) {
            this.listeners.push(listener);
            return this.unsubscribe.bind(this, listener);
        }

        emit() {
            for(let listener of this.listeners)
                setTimeout(listener, 0, ...arguments);
        }

        unsubscribe(listener) {
            let i = this.listeners.indexOf(listener);
            if(i >= 0) this.listeners.splice(i, 1);
        }
    }

    global.EventEmitter = EventEmitter;

})(window);