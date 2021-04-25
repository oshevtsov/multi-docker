import React, { useState, useEffect } from "react";
import axios from "axios";

function Fib() {
  const [state, setState] = useState({
    seenIndexes: [],
    values: {},
  });
  const [index, setIndex] = useState("");

  // Equivalent of 'componentDidMount' (see empty array as second argument)
  useEffect(() => {
    Promise.all([
      // fetch values
      axios.get("/api/values/current"),
      //fetch indexes
      axios.get("/api/values/all"),
    ])
      .then(([updateValues, updatedSeenIndexes]) => {
        setState({
          seenIndexes: updatedSeenIndexes.data,
          values: updateValues.data,
        });
      })
      .catch((error) => {
        console.log(error.message);
      });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    await axios.post("/api/values", {
      index: index,
    });

    setIndex("");
  };

  const indexesSeenSoFar = (seenIndexes) =>
    seenIndexes.map(({ number }) => number).join(", ");

  const cachedValues = (values) =>
    Object.entries(values).map(([key, value]) => (
      <div key={key}>
        For index {key} I calculated {value}
      </div>
    ));

  const handleIndexChange = (event) => setIndex(event.target.value);

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Enter your index:
          <input type="text" value={index} onChange={handleIndexChange} />
        </label>
        <button>Submit</button>
      </form>
      <h3>Indexes I have seen</h3>
      {indexesSeenSoFar(state.seenIndexes)}

      <h3>Calculated values</h3>
      {cachedValues(state.values)}
    </div>
  );
}

export default Fib;
