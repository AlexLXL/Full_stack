var vueRuntimeDom = (function (exports) {
    'use strict';

    const nodeOps = {
        createElement(tagName) {
            return document.createElement(tagName);
        },
        remove(child) {
            const parent = child.parentNode;
            if (parent) {
                parent.removeChild(child);
            }
        },
        querySelector(selector) {
            return document.querySelector(selector);
        },
        insert(child, parent, anchor = null) {
            parent.insertBefore(child, anchor);
        },
        createText(text) {
            return document.createTextNode(text);
        },
        setElementText(el, text) {
            el.textContent = text; // innerHTML会有风险
        },
        setText(node, text) {
            node.nodeValue = text;
        }
    };

    function patchClass(el, newValue) {
        if (newValue === null) {
            newValue = '';
        }
        el.className = newValue;
    }

    function patchStyle(el, oldValue, newValue) {
        const style = el.style;
        if (newValue === null) {
            el.removeAttribute('style');
        }
        else {
            if (oldValue) {
                for (let k in oldValue) {
                    if (newValue[k] === null) {
                        style[k] = '';
                    }
                }
            }
            for (let k in newValue) {
                style[k] = newValue[k];
            }
        }
    }

    function patchEvent(el, key, newValue) {
        const invokers = el._vei || (el._vei = {}); // 缓存起来
        const exists = invokers[key];
        if (exists && newValue) {
            exists.value = newValue;
        }
        else {
            const eventName = key.slice(2).toLowerCase();
            if (newValue) {
                const fn = invokers[key] = createInvoker(newValue);
                el.addEventListener(eventName, fn);
            }
            else {
                el.removeEventListener(eventName, exists);
            }
        }
    }
    function createInvoker(fn) {
        const invoker = (e) => { invoker.value(e); };
        invoker.value = fn;
        return invoker;
    }

    function patchAttr(el, key, newValue) {
        if (newValue === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, newValue);
        }
    }

    function patchProp(el, key, oldValue, newValue) {
        switch (key) {
            case 'class':
                patchClass(el, newValue);
                break;
            case 'style':
                patchStyle(el, oldValue, newValue);
                break;
            default:
                if (/^on[a-z]/.test(key)) {
                    patchEvent(el, key, newValue);
                }
                else {
                    patchAttr(el, key, newValue);
                }
        }
    }

    const isObject = v => typeof v === 'object' && v !== null;
    const isString = v => typeof v === 'string';
    const isFunction = v => typeof v === 'function';
    const isArray = Array.isArray;
    const extend = Object.assign;
    const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);

    /**
     * 创建虚拟node
     * @param type 可能传组件配置setup, 可能传h创建的div
     * @param props
     * @param children
     */
    function createVnode(type, props, children = null) {
        let shapeFlag = isString(type) ? 1 /* ELEMENT */ :
            isObject(type) ? 4 /* STATEFUL_COMPONENT */ :
                0;
        let vnode = {
            __v_isVnode: true,
            type,
            props,
            children,
            el: null,
            key: props && props.key,
            shapeFlag
        };
        normalizeChildren(vnode, children);
        return vnode;
    }
    function normalizeChildren(vnode, children) {
        if (children === null) ;
        else if (isArray(children)) {
            vnode.shapeFlag |= 16 /* ARRAY_CHILDREN */;
        }
        else {
            vnode.shapeFlag |= 8 /* TEXT_CHILDREN */;
        }
    }

    function createAppAPI(render) {
        return function createApp(rootComponent, props) {
            let app = {
                _component: rootComponent,
                _rootProps: props,
                _container: null,
                use() { },
                mixin() { },
                component() { },
                mount(container) {
                    let vnode = createVnode(rootComponent, props);
                    render(vnode, container);
                    app._container = container;
                }
            };
            return app;
        };
    }

    /**
     * 创建组件实例
     * @param vnode
     */
    function createComponentInstance(vnode) {
        let instance = {
            vnode,
            data: {},
            attrs: {},
            props: {},
            slots: {},
            render: null,
            setupState: {},
            subTree: null,
            isMounted: false,
            bc: null,
            m: null,
            ctx: {},
            proxy: {}
        };
        instance.ctx = { _: instance };
        return instance;
    }
    /**
     * 添加setup数据到实例
     * @param vnode
     */
    function setupComponent(instance) {
        let isStateful = isStatefulComponent(instance.vnode);
        isStateful ? setupStatefulComponent(instance) : undefined;
    }
    function isStatefulComponent(vnode) {
        return vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */;
    }
    function setupStatefulComponent(instance) {
        instance.proxy = new Proxy(instance.ctx, {
            get({ _: instance }, key) {
                let { setupState, data, props } = instance;
                if (hasOwn(setupState, key)) {
                    return setupState[key];
                }
                else if (hasOwn(data, key)) {
                    return data[key];
                }
                else if (hasOwn(props, key)) {
                    return props[key];
                }
            },
            set({ _: instance }, key, value) {
                let { setupState, data, props } = instance;
                if (hasOwn(setupState, key)) {
                    setupState[key] = value;
                }
                else if (hasOwn(data, key)) {
                    data[key] = value;
                }
                else if (hasOwn(props, key)) {
                    props[key] = value;
                }
                return true;
            }
        });
        let Component = instance.vnode.type; // 整个组件配置
        let { setup } = Component;
        if (setup) {
            let context = createContext(instance);
            let setupReturn = setup(instance.props, context);
            handleSetupReturn(instance, setupReturn);
        }
    }
    function createContext(instance) {
        return {
            attrs: instance.attrs,
            slots: instance.slots,
            emit: () => { },
            expose: () => { }
            // 如果用户使用了ref属性放到了组件上，expose默认拿到组件实例
            // 但如果定义了expose, 默认拿到expose
        };
    }
    function handleSetupReturn(instance, setupReturn) {
        if (isFunction(setupReturn)) {
            instance.render = setupReturn;
        }
        else if (isObject(setupReturn)) {
            instance.setupState = setupReturn;
        }
        finishComponentSetup(instance);
    }
    /**
     * 完善实例
     * 1.补充render函数(有render直接用render,没render用template生成)
     */
    function finishComponentSetup(instance) {
        let component = instance.vnode.type;
        if (!instance.render) {
            if (!component.render && component.template) ;
            instance.render = component.render;
        }
    }

    function createRender(renderOption) {
        // Vnode -> realDOM
        // [而vue2的render是执行_render函数生成Vnode, _update才是Vnode -> realDOM]
        const render = (vnode, container) => {
            patch(null, vnode);
        };
        const patch = (vnode1, vnode2, container) => {
            // if (vnode1 !== null) {
            //     // TODO: diff
            // }else {
            let { shapeFlag } = vnode2;
            if (shapeFlag & 1 /* ELEMENT */) ;
            else if (shapeFlag & 4 /* STATEFUL_COMPONENT */) {
                processComponent(vnode1, vnode2);
            }
            // }
        };
        return {
            createApp: createAppAPI(render)
        };
    }
    function processComponent(vnode1, vnode2, container) {
        if (vnode1 === null) {
            mountComponent(vnode2);
        }
    }
    function mountComponent(vnode2, container) {
        let instance = createComponentInstance(vnode2); // 创建组件实例对象
        setupComponent(instance); // 将setup数据添加到组件实例对象
    }

    /**
     * runtime-dom: 主要是对dom的一些操作
     */
    let renderOptions = extend(nodeOps, { patchProp });
    console.log(renderOptions);
    function createApp(rootComponent, props = null) {
        // core返回createApp和mount, 然后进行dom平台的封装
        const app = createRender().createApp(rootComponent, props);
        let { mount } = app;
        app.mount = function (container) {
            container = nodeOps.querySelector(container);
            container.innerHTML = '';
            let proxy = mount(container);
            return proxy;
        };
        return app;
    }
    function h() { }

    exports.createApp = createApp;
    exports.h = h;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
//# sourceMappingURL=runtime-dom.global.js.map
