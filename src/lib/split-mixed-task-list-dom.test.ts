import { describe, it, expect } from "vitest";

import { splitMixedTaskListDOM } from "@/lib/split-mixed-task-list-dom";

describe("splitMixedTaskListDOM", () => {
  it("splits mixed bullet and task items into separate lists", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <ul class="contains-task-list">
        <li><p>bullet</p></li>
        <li><p>bullet two</p></li>
        <li class="task-list-item" data-checked="false"><p>todo</p></li>
        <li class="task-list-item" data-checked="true"><p>done</p></li>
      </ul>
    `;

    splitMixedTaskListDOM(root);

    const lists = [...root.querySelectorAll("ul")];
    expect(lists).toHaveLength(2);
    expect(lists[0]?.getAttribute("data-type")).toBeNull();
    expect(lists[0]?.children).toHaveLength(2);
    expect(lists[1]?.getAttribute("data-type")).toBe("taskList");
    expect(lists[1]?.children).toHaveLength(2);
  });

  it("leaves pure task lists intact", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <ul class="contains-task-list">
        <li class="task-list-item"><p>todo</p></li>
      </ul>
    `;

    splitMixedTaskListDOM(root);

    const lists = [...root.querySelectorAll("ul")];
    expect(lists).toHaveLength(1);
    expect(lists[0]?.getAttribute("data-type")).toBe("taskList");
  });
});
