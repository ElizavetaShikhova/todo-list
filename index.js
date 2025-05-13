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
            element.addEventListener(callback.eventType, callback.listener)
        });
    } else if (callbacks) {
        element.addEventListener(callbacks.eventType, callbacks.listener)
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
        this.todo = todo;
        this.index = index;
        this.onDelete = onDelete;
        this.onToggle = onToggle;
        this.state.confirmDelete = false;
    }

    handleDeleteClick = () => {
        if (!this.state.confirmDelete) {
            this.state.confirmDelete = true;
            this.update();
        } else {
            this.onDelete(this.index);
        }
    };

    render() {
        return createElement("li", {}, [
            createElement("input", {
                type: "checkbox",
                checked: this.todo.completed ? "" : undefined
            }, [], {
                eventType: "change",
                listener: (e) => this.onToggle(this.index, e.target.checked)
            }),
            createElement(
                "label",
                { style: this.todo.completed ? "color: gray; text-decoration: line-through;" : "" },
                this.todo.label
            ),
            createElement(
                "button",
                { style: this.state.confirmDelete ? "background: red; color: white;" : "" },
                "🗑",
                {
                    eventType: "click",
                    listener: this.handleDeleteClick
                }
            )
        ]);
    }
}

class AddTask extends Component {
    constructor({ labelText, onInputChange, onAdd }) {
        super();
        this.labelText = labelText;
        this.onInputChange = onInputChange;
        this.onAdd = onAdd;
    }

    render() {
        return createElement("div", { class: "add-todo" }, [
            createElement("input", {
                id: "new-todo",
                type: "text",
                placeholder: "Задание",
                value: this.labelText
            }, [], { eventType: "input", listener: this.onInputChange }),
            createElement("button", { id: "add-btn" }, "+", { eventType: "click", listener: this.onAdd }),
        ]);
    }
}

class TodoList extends Component {
    constructor() {
        super();
        this.state.todos = loadTodosFromStorage() ?? [];
        this.state.labelText = "";
    }

    onAddTask = () => {
        if (this.state.labelText.trim()) {
            this.state.todos.push({ label: this.state.labelText });
            this.state.labelText = "";
            this.update();
        }
    };

    onAddInputChange = (e) => {
        this.state.labelText = e.target.value;
    };

    onDeleteTask = (index) => {
        this.state.todos.splice(index, 1);
        this.update();
    };


    onToggleTask = (index, checked) => {
        this.state.todos[index].completed = checked;
        this.update();
    };

    render() {
        saveTodosToStorage(this.state.todos);
        const todoes = this.state.todos.map((todo, index) =>
            new Task({
                todo,
                index,
                onDelete: this.onDeleteTask,
                onToggle: this.onToggleTask
            }).getDomNode()
        );

        return createElement("div", { class: "todo-list" }, [
            createElement("h1", {}, "TODO List"),
            new AddTask({
                labelText: this.state.labelText,
                onInputChange: this.onAddInputChange,
                onAdd: this.onAddTask
            }).getDomNode(),
            createElement("ul", { id: "todos" }, todoes)
        ]);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(new TodoList().getDomNode());
});