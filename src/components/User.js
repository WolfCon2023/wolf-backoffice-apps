import { useEffect, useState } from "react";
import axios from "axios";

const User = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const apiUrl = `${process.env.REACT_APP_API_BASE_URL}/users`;
    console.log("Fetching users from API:", apiUrl);

    axios.get(apiUrl, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
    .then(response => {
      console.log("Fetched users:", response.data);
      setUsers(response.data);
    })
    .catch(error => {
      console.error("Error fetching users:", error);
    });
  }, []);

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map((user, index) => (
          <li key={index}>{user.username} - {user.email}</li>
        ))}
      </ul>
    </div>
  );
};

export default User;
