
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
    	let div4;
    	let t17;
    	let div5;
    	let h24;
    	let t19;
    	let ul;
    	let li0;
    	let t20;
    	let br0;
    	let t21;
    	let t22;
    	let li1;
    	let t23;
    	let br1;
    	let t24;
    	let t25;
    	let li2;
    	let t26;
    	let br2;
    	let t27;
    	let t28;
    	let div6;
    	let h25;
    	let t30;
    	let label0;
    	let t32;
    	let input0;
    	let t33;
    	let label1;
    	let t35;
    	let input1;
    	let t36;
    	let label2;
    	let t38;
    	let textarea;
    	let t39;
    	let br3;
    	let t40;
    	let button;
    	let t42;
    	let p3;

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
    			div3 = element("div");
    			div0 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Frameworks";
    			t5 = space();
    			p0 = element("p");
    			p0.textContent = "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Nam eum soluta\n        laudantium ducimus iure placeat est totam molestias nobis corporis, iste\n        dolorem in molestiae qui quibusdam ex delectus maxime. Ab.";
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
    			div4 = element("div");
    			div4.textContent = "This area will be a gallery with images of projects";
    			t17 = space();
    			div5 = element("div");
    			h24 = element("h2");
    			h24.textContent = "What they're saying";
    			t19 = space();
    			ul = element("ul");
    			li0 = element("li");
    			t20 = text("\"You're my favorite customer.\"");
    			br0 = element("br");
    			t21 = text("\n        -Me, to you one day");
    			t22 = space();
    			li1 = element("li");
    			t23 = text("\"Lorem ipsum dolor sit amet consectetur adipisicing elit. Laudantium\n        sequi perspiciatis voluptatibus ipsam odit amet maxime impedit eos saepe\n        reiciendis? Soluta id molestias accusantium sint facere ducimus nulla\n        dolores est.\"");
    			br1 = element("br");
    			t24 = text("\n        -Some generic Latin text");
    			t25 = space();
    			li2 = element("li");
    			t26 = text("\"This isn't actually a quote from anyone. It's just some stuff I'm writing in as a filler quote.\"");
    			br2 = element("br");
    			t27 = text("\n\t\t\t\t-Stranger on the Internet");
    			t28 = space();
    			div6 = element("div");
    			h25 = element("h2");
    			h25.textContent = "Let's get in touch!";
    			t30 = space();
    			label0 = element("label");
    			label0.textContent = "Name";
    			t32 = space();
    			input0 = element("input");
    			t33 = space();
    			label1 = element("label");
    			label1.textContent = "Email";
    			t35 = space();
    			input1 = element("input");
    			t36 = space();
    			label2 = element("label");
    			label2.textContent = "Describe your project";
    			t38 = space();
    			textarea = element("textarea");
    			t39 = space();
    			br3 = element("br");
    			t40 = space();
    			button = element("button");
    			button.textContent = "Submit";
    			t42 = space();
    			p3 = element("p");
    			p3.textContent = "Some ending stuff";
    			attr_dev(h1, "class", "svelte-91l55w");
    			add_location(h1, file, 11, 4, 202);
    			attr_dev(header, "class", "svelte-91l55w");
    			add_location(header, file, 10, 2, 189);
    			add_location(h20, file, 14, 2, 240);
    			add_location(h21, file, 22, 6, 482);
    			add_location(p0, file, 23, 6, 508);
    			attr_dev(div0, "class", "card svelte-91l55w");
    			add_location(div0, file, 21, 4, 457);
    			add_location(h22, file, 30, 6, 792);
    			add_location(p1, file, 31, 6, 816);
    			attr_dev(div1, "class", "card svelte-91l55w");
    			add_location(div1, file, 29, 4, 767);
    			add_location(h23, file, 39, 6, 1148);
    			add_location(p2, file, 40, 6, 1170);
    			attr_dev(div2, "class", "card svelte-91l55w");
    			add_location(div2, file, 38, 4, 1123);
    			attr_dev(div3, "id", "bullets");
    			attr_dev(div3, "class", "svelte-91l55w");
    			add_location(div3, file, 20, 2, 434);
    			attr_dev(div4, "id", "gallery");
    			attr_dev(div4, "class", "card svelte-91l55w");
    			add_location(div4, file, 49, 2, 1474);
    			add_location(h24, file, 54, 4, 1614);
    			add_location(br0, file, 57, 38, 1701);
    			attr_dev(li0, "class", "svelte-91l55w");
    			add_location(li0, file, 56, 6, 1658);
    			add_location(br1, file, 64, 21, 2016);
    			attr_dev(li1, "class", "svelte-91l55w");
    			add_location(li1, file, 60, 6, 1754);
    			add_location(br2, file, 67, 104, 2172);
    			attr_dev(li2, "class", "svelte-91l55w");
    			add_location(li2, file, 67, 3, 2071);
    			attr_dev(ul, "class", "svelte-91l55w");
    			add_location(ul, file, 55, 4, 1647);
    			attr_dev(div5, "id", "testemonial");
    			attr_dev(div5, "class", "card svelte-91l55w");
    			add_location(div5, file, 53, 2, 1574);
    			add_location(h25, file, 74, 4, 2266);
    			attr_dev(label0, "for", "name");
    			add_location(label0, file, 75, 4, 2299);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "svelte-91l55w");
    			add_location(input0, file, 76, 4, 2334);
    			attr_dev(label1, "for", "email");
    			add_location(label1, file, 78, 2, 2359);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "svelte-91l55w");
    			add_location(input1, file, 79, 2, 2394);
    			attr_dev(label2, "for", "description");
    			add_location(label2, file, 81, 2, 2417);
    			attr_dev(textarea, "name", "description");
    			attr_dev(textarea, "id", "description");
    			attr_dev(textarea, "cols", "99");
    			attr_dev(textarea, "rows", "10");
    			add_location(textarea, file, 82, 2, 2474);
    			add_location(br3, file, 83, 2, 2554);
    			attr_dev(button, "type", "submit");
    			add_location(button, file, 84, 2, 2561);
    			attr_dev(div6, "id", "contact-form");
    			attr_dev(div6, "class", "svelte-91l55w");
    			add_location(div6, file, 73, 2, 2238);
    			add_location(p3, file, 87, 2, 2611);
    			attr_dev(main, "class", "svelte-91l55w");
    			add_location(main, file, 9, 0, 180);
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
    			append_dev(main, div3);
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
    			append_dev(main, t15);
    			append_dev(main, div4);
    			append_dev(main, t17);
    			append_dev(main, div5);
    			append_dev(div5, h24);
    			append_dev(div5, t19);
    			append_dev(div5, ul);
    			append_dev(ul, li0);
    			append_dev(li0, t20);
    			append_dev(li0, br0);
    			append_dev(li0, t21);
    			append_dev(ul, t22);
    			append_dev(ul, li1);
    			append_dev(li1, t23);
    			append_dev(li1, br1);
    			append_dev(li1, t24);
    			append_dev(ul, t25);
    			append_dev(ul, li2);
    			append_dev(li2, t26);
    			append_dev(li2, br2);
    			append_dev(li2, t27);
    			append_dev(main, t28);
    			append_dev(main, div6);
    			append_dev(div6, h25);
    			append_dev(div6, t30);
    			append_dev(div6, label0);
    			append_dev(div6, t32);
    			append_dev(div6, input0);
    			append_dev(div6, t33);
    			append_dev(div6, label1);
    			append_dev(div6, t35);
    			append_dev(div6, input1);
    			append_dev(div6, t36);
    			append_dev(div6, label2);
    			append_dev(div6, t38);
    			append_dev(div6, textarea);
    			append_dev(div6, t39);
    			append_dev(div6, br3);
    			append_dev(div6, t40);
    			append_dev(div6, button);
    			append_dev(main, t42);
    			append_dev(main, p3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
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

    function instance($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
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
