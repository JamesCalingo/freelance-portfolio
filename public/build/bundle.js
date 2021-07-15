
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    // Track which nodes are claimed during hydration. Unclaimed nodes can then be removed from the DOM
    // at the end of hydration without touching the remaining nodes.
    let is_hydrating = false;
    function start_hydrating() {
        is_hydrating = true;
    }
    function end_hydrating() {
        is_hydrating = false;
    }
    function upper_bound(low, high, key, value) {
        // Return first index of value larger than input value in the range [low, high)
        while (low < high) {
            const mid = low + ((high - low) >> 1);
            if (key(mid) <= value) {
                low = mid + 1;
            }
            else {
                high = mid;
            }
        }
        return low;
    }
    function init_hydrate(target) {
        if (target.hydrate_init)
            return;
        target.hydrate_init = true;
        // We know that all children have claim_order values since the unclaimed have been detached
        const children = target.childNodes;
        /*
        * Reorder claimed children optimally.
        * We can reorder claimed children optimally by finding the longest subsequence of
        * nodes that are already claimed in order and only moving the rest. The longest
        * subsequence subsequence of nodes that are claimed in order can be found by
        * computing the longest increasing subsequence of .claim_order values.
        *
        * This algorithm is optimal in generating the least amount of reorder operations
        * possible.
        *
        * Proof:
        * We know that, given a set of reordering operations, the nodes that do not move
        * always form an increasing subsequence, since they do not move among each other
        * meaning that they must be already ordered among each other. Thus, the maximal
        * set of nodes that do not move form a longest increasing subsequence.
        */
        // Compute longest increasing subsequence
        // m: subsequence length j => index k of smallest value that ends an increasing subsequence of length j
        const m = new Int32Array(children.length + 1);
        // Predecessor indices + 1
        const p = new Int32Array(children.length);
        m[0] = -1;
        let longest = 0;
        for (let i = 0; i < children.length; i++) {
            const current = children[i].claim_order;
            // Find the largest subsequence length such that it ends in a value less than our current value
            // upper_bound returns first greater value, so we subtract one
            const seqLen = upper_bound(1, longest + 1, idx => children[m[idx]].claim_order, current) - 1;
            p[i] = m[seqLen] + 1;
            const newLen = seqLen + 1;
            // We can guarantee that current is the smallest value. Otherwise, we would have generated a longer sequence.
            m[newLen] = i;
            longest = Math.max(newLen, longest);
        }
        // The longest increasing subsequence of nodes (initially reversed)
        const lis = [];
        // The rest of the nodes, nodes that will be moved
        const toMove = [];
        let last = children.length - 1;
        for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
            lis.push(children[cur - 1]);
            for (; last >= cur; last--) {
                toMove.push(children[last]);
            }
            last--;
        }
        for (; last >= 0; last--) {
            toMove.push(children[last]);
        }
        lis.reverse();
        // We sort the nodes being moved to guarantee that their insertion order matches the claim order
        toMove.sort((a, b) => a.claim_order - b.claim_order);
        // Finally, we move the nodes
        for (let i = 0, j = 0; i < toMove.length; i++) {
            while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
                j++;
            }
            const anchor = j < lis.length ? lis[j] : null;
            target.insertBefore(toMove[i], anchor);
        }
    }
    function append(target, node) {
        if (is_hydrating) {
            init_hydrate(target);
            if ((target.actual_end_child === undefined) || ((target.actual_end_child !== null) && (target.actual_end_child.parentElement !== target))) {
                target.actual_end_child = target.firstChild;
            }
            if (node !== target.actual_end_child) {
                target.insertBefore(node, target.actual_end_child);
            }
            else {
                target.actual_end_child = node.nextSibling;
            }
        }
        else if (node.parentNode !== target) {
            target.appendChild(node);
        }
    }
    function insert(target, node, anchor) {
        if (is_hydrating && !anchor) {
            append(target, node);
        }
        else if (node.parentNode !== target || (anchor && node.nextSibling !== anchor)) {
            target.insertBefore(node, anchor || null);
        }
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                start_hydrating();
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            end_hydrating();
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.3' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/App.svelte generated by Svelte v3.38.3 */

    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let header;
    	let h1;
    	let t1;
    	let h20;
    	let t3;
    	let div7;
    	let div3;
    	let div0;
    	let h21;
    	let t5;
    	let p0;
    	let t7;
    	let div1;
    	let h22;
    	let t9;
    	let p1;
    	let t11;
    	let div2;
    	let h23;
    	let t13;
    	let p2;
    	let t15;
    	let div6;
    	let div4;
    	let h4;
    	let t17;
    	let div5;
    	let t19;
    	let div8;
    	let t21;
    	let div9;
    	let h24;
    	let t23;
    	let ul;
    	let li0;
    	let t24;
    	let br0;
    	let t25;
    	let t26;
    	let li1;
    	let t27;
    	let br1;
    	let t28;
    	let t29;
    	let li2;
    	let t30;
    	let br2;
    	let t31;
    	let t32;
    	let div10;
    	let h25;
    	let t34;
    	let label0;
    	let t36;
    	let input0;
    	let t37;
    	let label1;
    	let t39;
    	let input1;
    	let t40;
    	let label2;
    	let t42;
    	let textarea;
    	let t43;
    	let br3;
    	let t44;
    	let button0;
    	let t46;
    	let p3;
    	let t48;
    	let button1;
    	let a0;
    	let t50;
    	let p4;
    	let t51;
    	let a1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			header = element("header");
    			h1 = element("h1");
    			h1.textContent = "JAMES CALINGO";
    			t1 = space();
    			h20 = element("h2");
    			h20.textContent = "Hi! I'm James Calingo (or \"JC\" as my friends call me), a full stack web\n    developer with experience in modern HTML, CSS, and JavaScript, as well as\n    several frameworks.";
    			t3 = space();
    			div7 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Frameworks";
    			t5 = space();
    			p0 = element("p");
    			p0.textContent = "Using the latest frameworks and tools, make a website that looks and\n        functions well on computers, phones, and tablets.";
    			t7 = space();
    			div1 = element("div");
    			h22 = element("h2");
    			h22.textContent = "BUZZWORD";
    			t9 = space();
    			p1 = element("p");
    			p1.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Repudiandae\n        veritatis delectus, deserunt suscipit cumque blanditiis veniam aliquam\n        voluptatum maiores, nesciunt odit debitis aspernatur, hic accusamus\n        excepturi in voluptas eveniet optio.";
    			t11 = space();
    			div2 = element("div");
    			h23 = element("h2");
    			h23.textContent = "card 3";
    			t13 = space();
    			p2 = element("p");
    			p2.textContent = "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Perspiciatis\n        quos tenetur libero soluta. Nihil voluptate, modi atque odit, rem\n        similique, delectus voluptates repellat laborum quasi velit accusantium\n        temporibus tempore quas?";
    			t15 = space();
    			div6 = element("div");
    			div4 = element("div");
    			h4 = element("h4");
    			h4.textContent = "At our company, we do our best to make sure YOU are satisfied. We work extensively for your satisfaction - which is basically what I said in the first sentence.";
    			t17 = space();
    			div5 = element("div");
    			div5.textContent = "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Culpa magni, vero debitis commodi corporis ad, praesentium consectetur voluptatum in veniam aperiam sunt nisi rem. Eos quam modi eaque omnis sed.";
    			t19 = space();
    			div8 = element("div");
    			div8.textContent = "This area will be a gallery with images of projects";
    			t21 = space();
    			div9 = element("div");
    			h24 = element("h2");
    			h24.textContent = "What they're saying";
    			t23 = space();
    			ul = element("ul");
    			li0 = element("li");
    			t24 = text("\"You're my favorite customer.\"");
    			br0 = element("br");
    			t25 = text("\n        -Me, to you one day");
    			t26 = space();
    			li1 = element("li");
    			t27 = text("\"Lorem ipsum dolor sit amet consectetur adipisicing elit. Laudantium\n        sequi perspiciatis voluptatibus ipsam odit amet maxime impedit eos saepe\n        reiciendis? Soluta id molestias accusantium sint facere ducimus nulla\n        dolores est.\"");
    			br1 = element("br");
    			t28 = text("\n        -Some generic Latin text");
    			t29 = space();
    			li2 = element("li");
    			t30 = text("\"This isn't actually a quote from anyone. It's just some stuff I'm\n        writing in as a filler quote.\"");
    			br2 = element("br");
    			t31 = text("\n        -Stranger on the Internet");
    			t32 = space();
    			div10 = element("div");
    			h25 = element("h2");
    			h25.textContent = "Let's get in touch!";
    			t34 = space();
    			label0 = element("label");
    			label0.textContent = "Name";
    			t36 = space();
    			input0 = element("input");
    			t37 = space();
    			label1 = element("label");
    			label1.textContent = "Email";
    			t39 = space();
    			input1 = element("input");
    			t40 = space();
    			label2 = element("label");
    			label2.textContent = "Describe your project";
    			t42 = space();
    			textarea = element("textarea");
    			t43 = space();
    			br3 = element("br");
    			t44 = space();
    			button0 = element("button");
    			button0.textContent = "Submit";
    			t46 = space();
    			p3 = element("p");
    			p3.textContent = "Alternatively, you can send me an email here:";
    			t48 = space();
    			button1 = element("button");
    			a0 = element("a");
    			a0.textContent = "auhhhhEmaaaaaiiillll";
    			t50 = space();
    			p4 = element("p");
    			t51 = text("This site was made using ");
    			a1 = element("a");
    			a1.textContent = "Svelte";
    			attr_dev(h1, "class", "svelte-djnfdj");
    			add_location(h1, file, 8, 4, 107);
    			attr_dev(header, "class", "svelte-djnfdj");
    			add_location(header, file, 7, 2, 94);
    			add_location(h20, file, 11, 2, 145);
    			add_location(h21, file, 21, 6, 396);
    			attr_dev(p0, "class", "description svelte-djnfdj");
    			add_location(p0, file, 22, 6, 422);
    			attr_dev(div0, "class", "svelte-djnfdj");
    			add_location(div0, file, 20, 4, 384);
    			add_location(h22, file, 29, 6, 620);
    			attr_dev(p1, "class", "description svelte-djnfdj");
    			add_location(p1, file, 30, 6, 644);
    			attr_dev(div1, "class", "svelte-djnfdj");
    			add_location(div1, file, 28, 4, 608);
    			add_location(h23, file, 39, 6, 984);
    			attr_dev(p2, "class", "description svelte-djnfdj");
    			add_location(p2, file, 40, 6, 1006);
    			attr_dev(div2, "class", "svelte-djnfdj");
    			add_location(div2, file, 38, 4, 972);
    			attr_dev(div3, "id", "bullets");
    			attr_dev(div3, "class", "svelte-djnfdj");
    			add_location(div3, file, 19, 2, 361);
    			add_location(h4, file, 51, 4, 1365);
    			add_location(div4, file, 50, 4, 1355);
    			attr_dev(div5, "class", "card svelte-djnfdj");
    			add_location(div5, file, 53, 4, 1548);
    			attr_dev(div6, "id", "paragraph");
    			attr_dev(div6, "class", "svelte-djnfdj");
    			add_location(div6, file, 49, 2, 1330);
    			attr_dev(div7, "class", "card svelte-djnfdj");
    			add_location(div7, file, 17, 2, 339);
    			attr_dev(div8, "id", "gallery");
    			attr_dev(div8, "class", "card svelte-djnfdj");
    			add_location(div8, file, 60, 2, 1810);
    			add_location(h24, file, 65, 4, 1950);
    			add_location(br0, file, 68, 38, 2037);
    			attr_dev(li0, "class", "svelte-djnfdj");
    			add_location(li0, file, 67, 6, 1994);
    			add_location(br1, file, 75, 21, 2352);
    			attr_dev(li1, "class", "svelte-djnfdj");
    			add_location(li1, file, 71, 6, 2090);
    			add_location(br2, file, 80, 38, 2528);
    			attr_dev(li2, "class", "svelte-djnfdj");
    			add_location(li2, file, 78, 6, 2410);
    			attr_dev(ul, "class", "svelte-djnfdj");
    			add_location(ul, file, 66, 4, 1983);
    			attr_dev(div9, "id", "testemonial");
    			attr_dev(div9, "class", "card svelte-djnfdj");
    			add_location(div9, file, 64, 2, 1910);
    			add_location(h25, file, 87, 4, 2631);
    			attr_dev(label0, "for", "name");
    			add_location(label0, file, 88, 4, 2664);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "svelte-djnfdj");
    			add_location(input0, file, 89, 4, 2699);
    			attr_dev(label1, "for", "email");
    			add_location(label1, file, 91, 4, 2726);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "svelte-djnfdj");
    			add_location(input1, file, 92, 4, 2763);
    			attr_dev(label2, "for", "description");
    			add_location(label2, file, 94, 4, 2790);
    			attr_dev(textarea, "name", "description");
    			attr_dev(textarea, "id", "description");
    			attr_dev(textarea, "rows", "10");
    			attr_dev(textarea, "class", "svelte-djnfdj");
    			add_location(textarea, file, 95, 4, 2849);
    			add_location(br3, file, 96, 4, 2912);
    			attr_dev(button0, "type", "submit");
    			add_location(button0, file, 97, 4, 2923);
    			add_location(p3, file, 99, 4, 2989);
    			attr_dev(a0, "href", "mailto:jciscreative@gmail.com");
    			attr_dev(a0, "class", "svelte-djnfdj");
    			add_location(a0, file, 101, 12, 3055);
    			attr_dev(button1, "class", "svelte-djnfdj");
    			add_location(button1, file, 101, 4, 3047);
    			attr_dev(div10, "id", "contact-form");
    			attr_dev(div10, "class", "svelte-djnfdj");
    			add_location(div10, file, 86, 2, 2603);
    			attr_dev(main, "class", "svelte-djnfdj");
    			add_location(main, file, 6, 0, 85);
    			attr_dev(a1, "href", "https://svelte.dev");
    			attr_dev(a1, "target", "blank");
    			add_location(a1, file, 105, 28, 3175);
    			add_location(p4, file, 105, 0, 3147);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, header);
    			append_dev(header, h1);
    			append_dev(main, t1);
    			append_dev(main, h20);
    			append_dev(main, t3);
    			append_dev(main, div7);
    			append_dev(div7, div3);
    			append_dev(div3, div0);
    			append_dev(div0, h21);
    			append_dev(div0, t5);
    			append_dev(div0, p0);
    			append_dev(div3, t7);
    			append_dev(div3, div1);
    			append_dev(div1, h22);
    			append_dev(div1, t9);
    			append_dev(div1, p1);
    			append_dev(div3, t11);
    			append_dev(div3, div2);
    			append_dev(div2, h23);
    			append_dev(div2, t13);
    			append_dev(div2, p2);
    			append_dev(div7, t15);
    			append_dev(div7, div6);
    			append_dev(div6, div4);
    			append_dev(div4, h4);
    			append_dev(div6, t17);
    			append_dev(div6, div5);
    			append_dev(main, t19);
    			append_dev(main, div8);
    			append_dev(main, t21);
    			append_dev(main, div9);
    			append_dev(div9, h24);
    			append_dev(div9, t23);
    			append_dev(div9, ul);
    			append_dev(ul, li0);
    			append_dev(li0, t24);
    			append_dev(li0, br0);
    			append_dev(li0, t25);
    			append_dev(ul, t26);
    			append_dev(ul, li1);
    			append_dev(li1, t27);
    			append_dev(li1, br1);
    			append_dev(li1, t28);
    			append_dev(ul, t29);
    			append_dev(ul, li2);
    			append_dev(li2, t30);
    			append_dev(li2, br2);
    			append_dev(li2, t31);
    			append_dev(main, t32);
    			append_dev(main, div10);
    			append_dev(div10, h25);
    			append_dev(div10, t34);
    			append_dev(div10, label0);
    			append_dev(div10, t36);
    			append_dev(div10, input0);
    			append_dev(div10, t37);
    			append_dev(div10, label1);
    			append_dev(div10, t39);
    			append_dev(div10, input1);
    			append_dev(div10, t40);
    			append_dev(div10, label2);
    			append_dev(div10, t42);
    			append_dev(div10, textarea);
    			append_dev(div10, t43);
    			append_dev(div10, br3);
    			append_dev(div10, t44);
    			append_dev(div10, button0);
    			append_dev(div10, t46);
    			append_dev(div10, p3);
    			append_dev(div10, t48);
    			append_dev(div10, button1);
    			append_dev(button1, a0);
    			insert_dev(target, t50, anchor);
    			insert_dev(target, p4, anchor);
    			append_dev(p4, t51);
    			append_dev(p4, a1);

    			if (!mounted) {
    				dispose = listen_dev(button0, "click", handleAlert, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (detaching) detach_dev(t50);
    			if (detaching) detach_dev(p4);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function handleAlert() {
    	alert("I got a click!");
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ handleAlert });
    	return [handleAlert];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { handleAlert: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get handleAlert() {
    		return handleAlert;
    	}

    	set handleAlert(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
