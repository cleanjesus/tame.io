import { useState, useEffect } from "react";

const TaskForm = ({ existingTask = {}, updateCallBack, selectedDay }) => {
  const [title, setTitle] = useState(existingTask.title || "");
  const [category, setCategory] = useState(existingTask.category || "work");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [priority, setPriority] = useState(existingTask.priority || "low");

  // Define categories
  const CATEGORIES = [
    { value: "work", label: "Work" },
    { value: "school", label: "School" },
    { value: "leisure", label: "Leisure" },
    { value: "wellness", label: "Wellness" },
    { value: "rest", label: "Rest" },
  ];

  // Determine if we're updating or creating a task
  const updating = Object.entries(existingTask).length !== 0;

  // Format time string from API to HTML time input format
  const formatTimeForInput = (timeStr) => {
    if (!timeStr) return "";
    // Remove seconds if they exist
    return timeStr.split(":").slice(0, 2).join(":");
  };

  useEffect(() => {
    if (updating) {
      setTitle(existingTask.title);
      setCategory(existingTask.category);
      setStartTime(formatTimeForInput(existingTask.start_time));
      setEndTime(formatTimeForInput(existingTask.end_time));
      setPriority(existingTask.priority);
    }
  }, [existingTask, updating]);

  const onSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in again");
      window.location.href = "/login";
      return;
    }

    const newTask = {
      title,
      category,
      start_time: startTime,
      end_time: endTime,
      priority,
      day: selectedDay,
    };

    const url =
      "http://127.0.0.1:5000/" +
      (updating ? `update_task/${existingTask.id}` : "create_task");

    try {
      const response = await fetch(url, {
        method: updating ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newTask),
      });

      if (response.status === 401) {
        alert("Session expired. Please log in again.");
        window.location.href = "/login";
        return;
      }

      const data = await response.json();
      if (response.ok) {
        updateCallBack();
      } else {
        alert(data.message || "An error occurred.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An unexpected error occurred.");
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <h2>{updating ? "Update Task" : "Create New Task"}</h2>

      <div className="form-group">
        <label className="form-label">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter task title"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Start Time</label>
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">End Time</label>
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Priority</label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          required
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <button type="submit">{updating ? "Update Task" : "Create Task"}</button>
    </form>
  );
};

export default TaskForm;
