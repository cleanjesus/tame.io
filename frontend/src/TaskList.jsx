import React, { useState, useEffect } from "react";
import TaskForm from "./TaskForm";
import "./App.css";

const TaskList = ({
  tasks,
  updateTask,
  updateCallBack,
  openCreateModal,
  isModalOpen,
  closeModal,
  currentTask,
  onTaskUpdate,
  selectedDay,
}) => {
  const [visibleTasks, setVisibleTasks] = useState([]);
  const [sortConfig, setSortConfig] = useState(() => {
    const savedSort = localStorage.getItem("taskSortConfig");
    return savedSort
      ? JSON.parse(savedSort)
      : {
          key: "priority",
          direction: "ascending",
        };
  });

  const [filterConfig, setFilterConfig] = useState(() => {
    const savedFilter = localStorage.getItem("taskFilterConfig");
    return savedFilter
      ? JSON.parse(savedFilter)
      : {
          priority: "all",
          category: "all",
        };
  });

  // Priority order mapping
  const priorityOrder = {
    high: 1,
    medium: 2,
    low: 3,
  };

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    const newSortConfig = { key, direction };
    setSortConfig(newSortConfig);
    localStorage.setItem("taskSortConfig", JSON.stringify(newSortConfig));
  };

  const handleFilterChange = (type, value) => {
    const newFilterConfig = { ...filterConfig, [type]: value };
    setFilterConfig(newFilterConfig);
    localStorage.setItem("taskFilterConfig", JSON.stringify(newFilterConfig));
  };

  const getSortedAndFilteredTasks = () => {
    let filteredTasks = [...tasks];

    // Apply filters
    if (filterConfig.priority !== "all") {
      filteredTasks = filteredTasks.filter(
        (task) => task.priority === filterConfig.priority
      );
    }
    if (filterConfig.category !== "all") {
      filteredTasks = filteredTasks.filter(
        (task) => task.category === filterConfig.category
      );
    }

    // Apply sorting
    return filteredTasks.sort((a, b) => {
      if (sortConfig.key === "priority") {
        const comparison =
          priorityOrder[a.priority] - priorityOrder[b.priority];
        return sortConfig.direction === "ascending" ? comparison : -comparison;
      }
      if (sortConfig.key === "time") {
        const timeA = a.start_time;
        const timeB = b.start_time;
        const comparison = timeA < timeB ? -1 : timeA > timeB ? 1 : 0;
        return sortConfig.direction === "ascending" ? comparison : -comparison;
      }
      return 0;
    });
  };

  // Get unique categories from tasks
  const categories = ["all", ...new Set(tasks.map((task) => task.category))];

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map((val) => parseInt(val, 10));
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);

    const timeFormat = localStorage.getItem("timeFormat") || "12h";

    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: timeFormat === "12h",
    }).format(date);
  };

  useEffect(() => {
    const tasksWithVisibility = tasks.map((task) => ({
      ...task,
      isVisible: false,
    }));
    setVisibleTasks(tasksWithVisibility);

    const timer = setTimeout(() => {
      setVisibleTasks(tasks.map((task) => ({ ...task, isVisible: true })));
    }, 10);

    return () => clearTimeout(timer);
  }, [tasks]);

  const onDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setVisibleTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id ? { ...task, isVisible: false } : task
      )
    );

    setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://127.0.0.1:5000/delete_task/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.ok) {
          updateCallBack();
        } else {
          const data = await response.json();
          alert(data.message || "Error deleting task");
        }
      } catch (error) {
        alert("Network error occurred");
      }
    }, 500);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: "#ef4444",
      medium: "#f59e0b",
      low: "#10b981",
    };
    return colors[priority] || "#6b7280";
  };

  return (
    <div className="task-list">
      <div className="header">
        <div className="header-title">Task List</div>
        <div className="task-controls">
          <div className="filter-sort-controls">
            <select
              value={filterConfig.priority}
              onChange={(e) => handleFilterChange("priority", e.target.value)}
              className="filter-select"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            <select
              value={filterConfig.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="filter-select"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all"
                    ? "All Categories"
                    : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>

            <div className="sort-buttons">
              <button
                onClick={() => handleSort("priority")}
                className={`sort-button ${
                  sortConfig.key === "priority" ? "active" : ""
                }`}
              >
                Sort by Priority
                {sortConfig.key === "priority" && (
                  <i
                    className={`fas fa-arrow-${
                      sortConfig.direction === "ascending" ? "up" : "down"
                    }`}
                  ></i>
                )}
              </button>
              <button
                onClick={() => handleSort("time")}
                className={`sort-button ${
                  sortConfig.key === "time" ? "active" : ""
                }`}
              >
                Sort by Time
                {sortConfig.key === "time" && (
                  <i
                    className={`fas fa-arrow-${
                      sortConfig.direction === "ascending" ? "up" : "down"
                    }`}
                  ></i>
                )}
              </button>
            </div>
          </div>
          <button onClick={openCreateModal} className="create-task-btn">
            Add New Task
          </button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Priority</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {getSortedAndFilteredTasks().length === 0 ? (
            <tr>
              <td colSpan="6" className="empty-state">
                No tasks found. Create a new task to get started!
              </td>
            </tr>
          ) : (
            getSortedAndFilteredTasks().map((task) => (
              <tr key={task.id}>
                <td>{task.title}</td>
                <td>{task.category.toUpperCase()}</td>
                <td>{formatTime(task.start_time)}</td>
                <td>{formatTime(task.end_time)}</td>
                <td>
                  <span className={`status-badge status-${task.priority}`}>
                    {task.priority}
                  </span>
                </td>
                <td>
                  <button onClick={() => updateTask(task)}>Update</button>
                  <button
                    onClick={() => onDelete(task.id)}
                    data-action="delete"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={closeModal}>
              &times;
            </span>
            <TaskForm
              existingTask={currentTask}
              updateCallBack={onTaskUpdate}
              selectedDay={selectedDay}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
