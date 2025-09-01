import express, { Express, Request, Response } from "express";
const app: Express = express();

const port: number = 2002;

app.get("/", (req: Request, res: Response) => {
  res.send("Hello world");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
