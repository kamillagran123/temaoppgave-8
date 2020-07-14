
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
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

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
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
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
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
        const prop_values = options.props || {};
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
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
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
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
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
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.19.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/App.svelte generated by Svelte v3.19.1 */

    const file = "src/App.svelte";

    // (46:1) {:else}
    function create_else_block(ctx) {
    	let h1;
    	let t1;
    	let h2;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Tasteful recipies";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "In need of some food inspiration? Look no further.";
    			attr_dev(h1, "id", "overskrift1");
    			attr_dev(h1, "class", "svelte-qs0n75");
    			add_location(h1, file, 47, 2, 1861);
    			attr_dev(h2, "id", "overskrift2");
    			attr_dev(h2, "class", "svelte-qs0n75");
    			add_location(h2, file, 48, 2, 1907);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h2, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(46:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (23:1) {#if meal}
    function create_if_block(ctx) {
    	let h1;
    	let t0_value = /*meal*/ ctx[0].strMeal + "";
    	let t0;
    	let t1;
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t2;
    	let div1;
    	let h30;
    	let t3;
    	let t4_value = /*meal*/ ctx[0].strCategory + "";
    	let t4;
    	let t5;
    	let h31;
    	let t7;
    	let p0;

    	let t8_value = (/*meal*/ ctx[0].strMeasure1
    	? /*meal*/ ctx[0].strMeasure1
    	: "") + "";

    	let t8;
    	let t9;

    	let t10_value = (/*meal*/ ctx[0].strIngredient1
    	? /*meal*/ ctx[0].strIngredient1
    	: "") + "";

    	let t10;
    	let t11;
    	let p1;

    	let t12_value = (/*meal*/ ctx[0].strMeasure2
    	? /*meal*/ ctx[0].strMeasure2
    	: "") + "";

    	let t12;
    	let t13;

    	let t14_value = (/*meal*/ ctx[0].strIngredient2
    	? /*meal*/ ctx[0].strIngredient2
    	: "") + "";

    	let t14;
    	let t15;
    	let p2;

    	let t16_value = (/*meal*/ ctx[0].strMeasure3
    	? /*meal*/ ctx[0].strMeasure3
    	: "") + "";

    	let t16;
    	let t17;

    	let t18_value = (/*meal*/ ctx[0].strIngredient3
    	? /*meal*/ ctx[0].strIngredient3
    	: "") + "";

    	let t18;
    	let t19;
    	let p3;

    	let t20_value = (/*meal*/ ctx[0].strMeasure4
    	? /*meal*/ ctx[0].strMeasure4
    	: "") + "";

    	let t20;
    	let t21;

    	let t22_value = (/*meal*/ ctx[0].strIngredient4
    	? /*meal*/ ctx[0].strIngredient4
    	: "") + "";

    	let t22;
    	let t23;
    	let p4;

    	let t24_value = (/*meal*/ ctx[0].strMeasure5
    	? /*meal*/ ctx[0].strMeasure5
    	: "") + "";

    	let t24;
    	let t25;

    	let t26_value = (/*meal*/ ctx[0].strIngredient5
    	? /*meal*/ ctx[0].strIngredient5
    	: "") + "";

    	let t26;
    	let t27;
    	let p5;

    	let t28_value = (/*meal*/ ctx[0].strMeasure6
    	? /*meal*/ ctx[0].strMeasure6
    	: "") + "";

    	let t28;
    	let t29;

    	let t30_value = (/*meal*/ ctx[0].strIngredient6
    	? /*meal*/ ctx[0].strIngredient6
    	: "") + "";

    	let t30;
    	let t31;
    	let p6;

    	let t32_value = (/*meal*/ ctx[0].strMeasure7
    	? /*meal*/ ctx[0].strMeasure7
    	: "") + "";

    	let t32;
    	let t33;

    	let t34_value = (/*meal*/ ctx[0].strIngredient7
    	? /*meal*/ ctx[0].strIngredient7
    	: "") + "";

    	let t34;
    	let t35;
    	let p7;

    	let t36_value = (/*meal*/ ctx[0].strMeasure8
    	? /*meal*/ ctx[0].strMeasure8
    	: "") + "";

    	let t36;
    	let t37;

    	let t38_value = (/*meal*/ ctx[0].strIngredient8
    	? /*meal*/ ctx[0].strIngredient8
    	: "") + "";

    	let t38;
    	let t39;
    	let p8;

    	let t40_value = (/*meal*/ ctx[0].strMeasure9
    	? /*meal*/ ctx[0].strMeasure9
    	: "") + "";

    	let t40;
    	let t41;

    	let t42_value = (/*meal*/ ctx[0].strIngredient9
    	? /*meal*/ ctx[0].strIngredient9
    	: "") + "";

    	let t42;
    	let t43;
    	let p9;

    	let t44_value = (/*meal*/ ctx[0].strMeasure10
    	? /*meal*/ ctx[0].strMeasure10
    	: "") + "";

    	let t44;
    	let t45;

    	let t46_value = (/*meal*/ ctx[0].strIngredient10
    	? /*meal*/ ctx[0].strIngredient10
    	: "") + "";

    	let t46;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t2 = space();
    			div1 = element("div");
    			h30 = element("h3");
    			t3 = text("Type of meal: ");
    			t4 = text(t4_value);
    			t5 = space();
    			h31 = element("h3");
    			h31.textContent = "This is what you need:";
    			t7 = space();
    			p0 = element("p");
    			t8 = text(t8_value);
    			t9 = space();
    			t10 = text(t10_value);
    			t11 = space();
    			p1 = element("p");
    			t12 = text(t12_value);
    			t13 = space();
    			t14 = text(t14_value);
    			t15 = space();
    			p2 = element("p");
    			t16 = text(t16_value);
    			t17 = space();
    			t18 = text(t18_value);
    			t19 = space();
    			p3 = element("p");
    			t20 = text(t20_value);
    			t21 = space();
    			t22 = text(t22_value);
    			t23 = space();
    			p4 = element("p");
    			t24 = text(t24_value);
    			t25 = space();
    			t26 = text(t26_value);
    			t27 = space();
    			p5 = element("p");
    			t28 = text(t28_value);
    			t29 = space();
    			t30 = text(t30_value);
    			t31 = space();
    			p6 = element("p");
    			t32 = text(t32_value);
    			t33 = space();
    			t34 = text(t34_value);
    			t35 = space();
    			p7 = element("p");
    			t36 = text(t36_value);
    			t37 = space();
    			t38 = text(t38_value);
    			t39 = space();
    			p8 = element("p");
    			t40 = text(t40_value);
    			t41 = space();
    			t42 = text(t42_value);
    			t43 = space();
    			p9 = element("p");
    			t44 = text(t44_value);
    			t45 = space();
    			t46 = text(t46_value);
    			attr_dev(h1, "id", "overskrift");
    			attr_dev(h1, "class", "svelte-qs0n75");
    			add_location(h1, file, 23, 2, 587);
    			if (img.src !== (img_src_value = /*meal*/ ctx[0].strMealThumb)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*meal*/ ctx[0].strMeal);
    			attr_dev(img, "class", "svelte-qs0n75");
    			add_location(img, file, 26, 3, 676);
    			attr_dev(div0, "class", "img svelte-qs0n75");
    			add_location(div0, file, 25, 2, 655);
    			attr_dev(h30, "class", "svelte-qs0n75");
    			add_location(h30, file, 29, 3, 762);
    			attr_dev(h31, "class", "svelte-qs0n75");
    			add_location(h31, file, 30, 3, 807);
    			attr_dev(p0, "class", "svelte-qs0n75");
    			add_location(p0, file, 31, 3, 842);
    			attr_dev(p1, "class", "svelte-qs0n75");
    			add_location(p1, file, 32, 3, 940);
    			attr_dev(p2, "class", "svelte-qs0n75");
    			add_location(p2, file, 33, 3, 1038);
    			attr_dev(p3, "class", "svelte-qs0n75");
    			add_location(p3, file, 34, 3, 1136);
    			attr_dev(p4, "class", "svelte-qs0n75");
    			add_location(p4, file, 35, 3, 1234);
    			attr_dev(p5, "class", "svelte-qs0n75");
    			add_location(p5, file, 36, 3, 1332);
    			attr_dev(p6, "class", "svelte-qs0n75");
    			add_location(p6, file, 37, 3, 1430);
    			attr_dev(p7, "class", "svelte-qs0n75");
    			add_location(p7, file, 38, 3, 1528);
    			attr_dev(p8, "class", "svelte-qs0n75");
    			add_location(p8, file, 39, 3, 1626);
    			attr_dev(p9, "class", "svelte-qs0n75");
    			add_location(p9, file, 40, 3, 1724);
    			attr_dev(div1, "class", "text svelte-qs0n75");
    			add_location(div1, file, 28, 2, 740);
    			attr_dev(div2, "class", "container svelte-qs0n75");
    			add_location(div2, file, 24, 2, 629);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, h30);
    			append_dev(h30, t3);
    			append_dev(h30, t4);
    			append_dev(div1, t5);
    			append_dev(div1, h31);
    			append_dev(div1, t7);
    			append_dev(div1, p0);
    			append_dev(p0, t8);
    			append_dev(p0, t9);
    			append_dev(p0, t10);
    			append_dev(div1, t11);
    			append_dev(div1, p1);
    			append_dev(p1, t12);
    			append_dev(p1, t13);
    			append_dev(p1, t14);
    			append_dev(div1, t15);
    			append_dev(div1, p2);
    			append_dev(p2, t16);
    			append_dev(p2, t17);
    			append_dev(p2, t18);
    			append_dev(div1, t19);
    			append_dev(div1, p3);
    			append_dev(p3, t20);
    			append_dev(p3, t21);
    			append_dev(p3, t22);
    			append_dev(div1, t23);
    			append_dev(div1, p4);
    			append_dev(p4, t24);
    			append_dev(p4, t25);
    			append_dev(p4, t26);
    			append_dev(div1, t27);
    			append_dev(div1, p5);
    			append_dev(p5, t28);
    			append_dev(p5, t29);
    			append_dev(p5, t30);
    			append_dev(div1, t31);
    			append_dev(div1, p6);
    			append_dev(p6, t32);
    			append_dev(p6, t33);
    			append_dev(p6, t34);
    			append_dev(div1, t35);
    			append_dev(div1, p7);
    			append_dev(p7, t36);
    			append_dev(p7, t37);
    			append_dev(p7, t38);
    			append_dev(div1, t39);
    			append_dev(div1, p8);
    			append_dev(p8, t40);
    			append_dev(p8, t41);
    			append_dev(p8, t42);
    			append_dev(div1, t43);
    			append_dev(div1, p9);
    			append_dev(p9, t44);
    			append_dev(p9, t45);
    			append_dev(p9, t46);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*meal*/ 1 && t0_value !== (t0_value = /*meal*/ ctx[0].strMeal + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*meal*/ 1 && img.src !== (img_src_value = /*meal*/ ctx[0].strMealThumb)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*meal*/ 1 && img_alt_value !== (img_alt_value = /*meal*/ ctx[0].strMeal)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*meal*/ 1 && t4_value !== (t4_value = /*meal*/ ctx[0].strCategory + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*meal*/ 1 && t8_value !== (t8_value = (/*meal*/ ctx[0].strMeasure1
    			? /*meal*/ ctx[0].strMeasure1
    			: "") + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*meal*/ 1 && t10_value !== (t10_value = (/*meal*/ ctx[0].strIngredient1
    			? /*meal*/ ctx[0].strIngredient1
    			: "") + "")) set_data_dev(t10, t10_value);

    			if (dirty & /*meal*/ 1 && t12_value !== (t12_value = (/*meal*/ ctx[0].strMeasure2
    			? /*meal*/ ctx[0].strMeasure2
    			: "") + "")) set_data_dev(t12, t12_value);

    			if (dirty & /*meal*/ 1 && t14_value !== (t14_value = (/*meal*/ ctx[0].strIngredient2
    			? /*meal*/ ctx[0].strIngredient2
    			: "") + "")) set_data_dev(t14, t14_value);

    			if (dirty & /*meal*/ 1 && t16_value !== (t16_value = (/*meal*/ ctx[0].strMeasure3
    			? /*meal*/ ctx[0].strMeasure3
    			: "") + "")) set_data_dev(t16, t16_value);

    			if (dirty & /*meal*/ 1 && t18_value !== (t18_value = (/*meal*/ ctx[0].strIngredient3
    			? /*meal*/ ctx[0].strIngredient3
    			: "") + "")) set_data_dev(t18, t18_value);

    			if (dirty & /*meal*/ 1 && t20_value !== (t20_value = (/*meal*/ ctx[0].strMeasure4
    			? /*meal*/ ctx[0].strMeasure4
    			: "") + "")) set_data_dev(t20, t20_value);

    			if (dirty & /*meal*/ 1 && t22_value !== (t22_value = (/*meal*/ ctx[0].strIngredient4
    			? /*meal*/ ctx[0].strIngredient4
    			: "") + "")) set_data_dev(t22, t22_value);

    			if (dirty & /*meal*/ 1 && t24_value !== (t24_value = (/*meal*/ ctx[0].strMeasure5
    			? /*meal*/ ctx[0].strMeasure5
    			: "") + "")) set_data_dev(t24, t24_value);

    			if (dirty & /*meal*/ 1 && t26_value !== (t26_value = (/*meal*/ ctx[0].strIngredient5
    			? /*meal*/ ctx[0].strIngredient5
    			: "") + "")) set_data_dev(t26, t26_value);

    			if (dirty & /*meal*/ 1 && t28_value !== (t28_value = (/*meal*/ ctx[0].strMeasure6
    			? /*meal*/ ctx[0].strMeasure6
    			: "") + "")) set_data_dev(t28, t28_value);

    			if (dirty & /*meal*/ 1 && t30_value !== (t30_value = (/*meal*/ ctx[0].strIngredient6
    			? /*meal*/ ctx[0].strIngredient6
    			: "") + "")) set_data_dev(t30, t30_value);

    			if (dirty & /*meal*/ 1 && t32_value !== (t32_value = (/*meal*/ ctx[0].strMeasure7
    			? /*meal*/ ctx[0].strMeasure7
    			: "") + "")) set_data_dev(t32, t32_value);

    			if (dirty & /*meal*/ 1 && t34_value !== (t34_value = (/*meal*/ ctx[0].strIngredient7
    			? /*meal*/ ctx[0].strIngredient7
    			: "") + "")) set_data_dev(t34, t34_value);

    			if (dirty & /*meal*/ 1 && t36_value !== (t36_value = (/*meal*/ ctx[0].strMeasure8
    			? /*meal*/ ctx[0].strMeasure8
    			: "") + "")) set_data_dev(t36, t36_value);

    			if (dirty & /*meal*/ 1 && t38_value !== (t38_value = (/*meal*/ ctx[0].strIngredient8
    			? /*meal*/ ctx[0].strIngredient8
    			: "") + "")) set_data_dev(t38, t38_value);

    			if (dirty & /*meal*/ 1 && t40_value !== (t40_value = (/*meal*/ ctx[0].strMeasure9
    			? /*meal*/ ctx[0].strMeasure9
    			: "") + "")) set_data_dev(t40, t40_value);

    			if (dirty & /*meal*/ 1 && t42_value !== (t42_value = (/*meal*/ ctx[0].strIngredient9
    			? /*meal*/ ctx[0].strIngredient9
    			: "") + "")) set_data_dev(t42, t42_value);

    			if (dirty & /*meal*/ 1 && t44_value !== (t44_value = (/*meal*/ ctx[0].strMeasure10
    			? /*meal*/ ctx[0].strMeasure10
    			: "") + "")) set_data_dev(t44, t44_value);

    			if (dirty & /*meal*/ 1 && t46_value !== (t46_value = (/*meal*/ ctx[0].strIngredient10
    			? /*meal*/ ctx[0].strIngredient10
    			: "") + "")) set_data_dev(t46, t46_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(23:1) {#if meal}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let link0;
    	let t0;
    	let link1;
    	let t1;
    	let header;
    	let button;
    	let t3;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*meal*/ ctx[0]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			link0 = element("link");
    			t0 = space();
    			link1 = element("link");
    			t1 = space();
    			header = element("header");
    			button = element("button");
    			button.textContent = "Give me some ideas!";
    			t3 = space();
    			if_block.c();
    			attr_dev(link0, "href", "https://fonts.googleapis.com/css2?family=Italianno&display=swap");
    			attr_dev(link0, "rel", "stylesheet");
    			add_location(link0, file, 16, 0, 244);
    			attr_dev(link1, "href", "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Italianno&family=Montserrat+Subrayada:wght@700&display=swap");
    			attr_dev(link1, "rel", "stylesheet");
    			add_location(link1, file, 17, 0, 339);
    			attr_dev(button, "class", "svelte-qs0n75");
    			add_location(button, file, 19, 2, 501);
    			attr_dev(header, "class", "svelte-qs0n75");
    			add_location(header, file, 18, 1, 490);
    			attr_dev(main, "class", "svelte-qs0n75");
    			add_location(main, file, 14, 0, 235);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, link0);
    			append_dev(main, t0);
    			append_dev(main, link1);
    			append_dev(main, t1);
    			append_dev(main, header);
    			append_dev(header, button);
    			append_dev(main, t3);
    			if_block.m(main, null);
    			dispose = listen_dev(button, "click", /*givemeameal*/ ctx[1], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(main, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block.d();
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

    function instance($$self, $$props, $$invalidate) {
    	let meal;

    	const givemeameal = () => {
    		fetch(`https://www.themealdb.com/api/json/v1/1/random.php`).then(res => res.json()).then(json => {
    			console.log(json);
    			$$invalidate(0, meal = json.meals[0]);
    		});
    	};

    	$$self.$capture_state = () => ({ meal, givemeameal, fetch, console });

    	$$self.$inject_state = $$props => {
    		if ("meal" in $$props) $$invalidate(0, meal = $$props.meal);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [meal, givemeameal];
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
