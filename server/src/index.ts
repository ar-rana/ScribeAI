import express from "express";

const app = express();
const port = 3001;

app.get("/", (req, res) => {
  res.send("Server is Online!");
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
