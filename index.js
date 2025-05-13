function createElement(tag, attributes, children, callbacks) {
    const element = document.createElement(tag);

    if (attributes) {
        Object.keys(attributes).forEach((key) => {
            if (attributes[key] !== undefined)
                element.setAttribute(key, attributes[key]);
        });
    }

    if (Array.isArray(children)) {
        children.forEach((child) => {
            if (typeof child === "string") {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof HTMLElement) {
                element.appendChild(child);
            } else if (child && child._domNode instanceof HTMLElement) {
                element.appendChild(child._domNode);
            }
        });
    } else if (typeof children === "string") {
        element.appendChild(document.createTextNode(children));
    } else if (children instanceof HTMLElement) {
        element.appendChild(children);
    } else if (children && children._domNode instanceof HTMLElement) {
        element.appendChild(children._domNode);
    }

    if (Array.isArray(callbacks)) {
        callbacks.forEach((callback) => {
            element.addEventListener(callback.eventType, callback.listener);
        });
    } else if (callbacks) {
        element.addEventListener(callbacks.eventType, callbacks.listener);
    }

    return element;
}

function saveTodosToStorage(todos) {
    localStorage.setItem("todos", JSON.stringify(todos));
}

function loadTodosFromStorage() {
    const data = localStorage.getItem("todos");
    try {
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

class Component {
    constructor() {
        this.state = {};
    }

    getDomNode() {
        this._domNode = this.render();
        return this._domNode;
    }

    update() {
        const newDomNode = this.render();
        if (this._domNode && this._domNode.parentNode) {
            this._domNode.parentNode.replaceChild(newDomNode, this._domNode);
        }
        this._domNode = newDomNode;
    }
}

class Task extends Component {
    constructor({ todo, index, onDelete, onToggle }) {
        super();
        this.props = { todo, index, onDelete, onToggle };
        this.state.confirmDelete = false;
    }

    setProps({ todo, index }) {
        this.props.todo = todo;
        this.props.index = index;
    }

    handleDeleteClick = () => {
        if (!this.state.confirmDelete) {
            this.state.confirmDelete = true;
            this.update();
        } else {
            this.props.onDelete(this.props.index);
        }
    };

    render() {
        const { todo, index, onToggle } = this.props;
        return createElement("li", {}, [
            createElement("input", {
                type: "checkbox",
                checked: todo.completed ? "" : undefined
            }, [], {
                eventType: "change",
                listener: (e) => onToggle(index, e.target.checked)
            }),
            createElement(
                "label",
                { style: todo.completed ? "color: gray; text-decoration: line-through;" : "" },
                todo.label
            ),
            createElement(
                "button",
                { style: this.state.confirmDelete ? "background: red; color: white;" : "" },
                "🗑",
                { eventType: "click", listener: this.handleDeleteClick }
            )
        ]);
    }
}

class AddTask extends Component {
    constructor({ labelText, onInputChange, onAdd }) {
        super();
        this.props = { labelText, onInputChange, onAdd };
    }

    setProps({ labelText }) {
        this.props.labelText = labelText;
    }

    render() {
        const { labelText, onInputChange, onAdd } = this.props;
        return createElement("div", { class: "add-todo" }, [
            createElement("input", {
                id: "new-todo",
                type: "text",
                placeholder: "Задание",
                value: labelText
            }, [], { eventType: "input", listener: onInputChange }),
            createElement("button", { id: "add-btn" }, "+", { eventType: "click", listener: onAdd }),
        ]);
    }
}

class TodoList extends Component {
    constructor() {
        super();
        this.state.todos = loadTodosFromStorage() ?? [];
        this.state.labelText = "";
        this.taskComponents = [];
        this.counter = 0;
        this.addTaskComponent = new AddTask({
            labelText: this.state.labelText,
            onInputChange: this.onAddInputChange,
            onAdd: this.onAddTask
        });
    }

    onAddTask = () => {
        if (this.state.labelText.trim()) {
            this.state.index = ++this.counter;
            this.state.todos.push({ index: this.counter, done:false, label: this.state.labelText });
            this.state.labelText = "";
            this.update();
        }
    };

    onAddInputChange = (e) => {
        this.state.labelText = e.target.value;
    };

    onDeleteTask = (index) => {
        this.state.todos = this.state.todos.filter(todo => todo.index != index)
        this.update();
    };

    onToggleTask = (index, checked) => {
        this.state.todos[index].completed = checked;
        this.update();
    };

    render() {
        saveTodosToStorage(this.state.todos);
        this.taskComponents = this.state.todos.map((todo) => {
            const existing = this.taskComponents[this.counter];
            if (existing) {
                existing.setProps({ todo, index: this.counter });
                existing.update();
                return existing;
            } else {
                const comp = new Task({
                    todo,
                    index: todo.index,
                    onDelete: this.onDeleteTask,
                    onToggle: this.onToggleTask
                });
                return comp;
            }
        });

        this.addTaskComponent.setProps({ labelText: this.state.labelText });
        this.addTaskComponent.update();

        const taskNodes = this.taskComponents.map((c) => c.getDomNode());

        return createElement("div", { class: "todo-list" }, [
            createElement("h1", {}, "TODO List"),
            this.addTaskComponent.getDomNode(),
            createElement("ul", { id: "todos" }, taskNodes)
        ]);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(new TodoList().getDomNode());
});
