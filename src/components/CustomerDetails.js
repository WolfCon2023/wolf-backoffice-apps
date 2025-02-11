import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const CustomerDetails = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    axios.get(`https://your-backend-url/api/customers/${id}`)
      .then(res => setCustomer(res.data))
      .catch(err => console.error("Error fetching customer details:", err));
  }, [id]);

  return (
    <div>
      <h1>Customer Details</h1>
      {customer ? (
        <div>
          <h2>{customer.first_name} {customer.last_name}</h2>
          <p>Email: {customer.business_email}</p>
          <p>Phone: {customer.phone_number || "N/A"}</p>
          <p>Product Line: {customer.product_lines}</p>
          <p>Notes: {customer.notes || "No notes available"}</p>
        </div>
      ) : (
        <p>Loading customer details...</p>
      )}
    </div>
  );
};

export default CustomerDetails;
