const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
const dateFns = require("date-fns/format");
const isValid = require("date-fns/isValid");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error at ${e.message}`);
  }
};
initializeDBAndServer();

app.use(express.json());
const myArray = [
  "HIGH",
  "MEDIUM",
  "LOW",
  "TO DO",
  "IN PROGRESS",
  "DONE",
  "WORK",
  "HOME",
  "LEARNING",
];

const isValidColumnValue = (data) => {
  console.log(myArray.includes(data));
  return myArray.includes(data) === false;
};
const isValidDate = (data) => {
  try {
    // console.log(isValid(new Date(data)));
    return isValid(new Date(data)) === false;
  } catch (e) {
    console.log(`Date Error ${e.message}`);
  }
};

//Get API todos path
const convertSnakeCase = (data) => {
  return {
    id: data.id,
    todo: data.todo,
    priority: data.priority,
    status: data.status,
    category: data.category,
    dueDate: data.due_date,
  };
};
const isStatus = (data) => {
  return data !== undefined;
};
const isPriority = (data) => {
  return data !== undefined;
};
const isPriorityAndStatus = (sta, pri) => {
  return sta !== undefined && pri !== undefined;
};
const isCategoryAndStatus = (cat, sta) => {
  return cat !== undefined && sta !== undefined;
};
const isCategoryAndPriority = (cat, pri) => {
  return cat !== undefined && pri !== undefined;
};
const isCategory = (data) => {
  return data !== undefined;
};

app.get("/todos/", async (request, response) => {
  const { search_q = "", status, category, priority } = request.query;
  let query = "";
  let data = "";
  switch (true) {
    case isStatus(status):
      if (isValidColumnValue(status) === true) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else {
        query = `
                SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}'
            `;
        data = await db.all(query);
        response.send(
          data.map((each) => {
            return convertSnakeCase(each);
          })
        );
      }
      break;
    case isPriority(priority):
      if (isValidColumnValue(priority) === true) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else {
        query = `
                SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority = '${priority}'
            `;
        data = await db.all(query);
        response.send(
          data.map((each) => {
            return convertSnakeCase(each);
          })
        );
      }
      break;
    case isPriorityAndStatus(status, priority):
      query = `
                SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}' AND priority = '${priority}'
            `;
      data = await db.all(query);
      response.send(
        data.map((each) => {
          return convertSnakeCase(each);
        })
      );
      break;
    case isCategoryAndStatus(category, status):
      query = `
                SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}' AND category = '${category}'
            `;
      data = await db.all(query);
      response.send(
        data.map((each) => {
          return convertSnakeCase(each);
        })
      );
      break;
    case isCategoryAndPriority(category, priority):
      query = `
                SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority = '${priority}' AND category = '${category}'
            `;
      data = await db.all(query);
      response.send(
        data.map((each) => {
          return convertSnakeCase(each);
        })
      );
      break;
    case isCategory(category):
      if (isValidColumnValue(category) === true) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else {
        query = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category = '${category}'`;
        data = await db.all(query);
        response.send(
          data.map((each) => {
            return convertSnakeCase(each);
          })
        );
      }
      break;
    default:
      query = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'`;
      data = await db.all(query);
      response.send(
        data.map((each) => {
          return convertSnakeCase(each);
        })
      );
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `
        SELECT * FROM todo WHERE id = ${todoId}
    `;
  const data = await db.get(query);
  response.send(convertSnakeCase(data));
});

const convertFormDate = (data) => {
  try {
    return isValid(new Date(data));
  } catch (e) {
    console.log(`Date Error at ${e.message}`);
  }
};
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const format = isValid(new Date(date));
  let code = 200;
  console.log(format);
  if (format === false) {
    code = 400;
    response.status(code);
    response.send("Invalid Due Date");
  } else {
    const dateForm = dateFns(new Date(date), "yyyy-MM-dd");
    const query = `
      SELECT * FROM todo WHERE due_date = "${dateForm}"
    `;
    const data = await db.all(query);
    response.status(code);
    response.send(
      data.map((each) => {
        return convertSnakeCase(each);
      })
    );
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  let res = "";
  let code = 200;
  switch (true) {
    case isValidColumnValue(status):
      res = "Invalid Todo Status";
      code = 400;
      break;
    case isValidColumnValue(priority):
      res = "Invalid Todo Priority";
      code = 400;
      break;
    case isValidColumnValue(category):
      res = "Invalid Todo Category";
      code = 400;
      break;
    case isValidDate(dueDate):
      res = "Invalid Due Date";
      code = 400;
      break;
    default:
      const query = `
      INSERT INTO todo(id,todo,priority,status,category,due_date)
      VALUES(${id},'${todo}','${priority}','${status}','${category}','${dueDate}')
      `;
      data = await db.run(query);
      res = "Todo Successfully Added";
  }
  response.status(code);
  response.send(res);
});

app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let code = 200;
  let reCol = "";
  let query = "";
  switch (true) {
    case requestBody.todo !== undefined:
      query = `UPDATE todo SET todo = '${requestBody.todo}' WHERE id = ${todoId}`;
      await db.run(query);
      reCol = "Todo Updated";
      break;
    case requestBody.priority !== undefined:
      if (isValidColumnValue(requestBody.priority) === true) {
        reCol = "Invalid Todo Priority";
        code = 400;
      } else {
        query = `UPDATE todo SET priority = '${requestBody.priority}'WHERE id = ${todoId}`;
        await db.run(query);

        reCol = "Priority Updated";
      }
      break;
    case requestBody.status !== undefined:
      if (isValidColumnValue(requestBody.status) === true) {
        reCol = "Invalid Todo Status";
        code = 400;
      } else {
        query = `UPDATE todo SET status = '${requestBody.status}'WHERE id = ${todoId}`;
        await db.run(query);

        reCol = "Status Updated";
      }
      break;
    case requestBody.category !== undefined:
      if (isValidColumnValue(requestBody.category) === true) {
        reCol = "Invalid Todo Category";
        code = 400;
      } else {
        query = `UPDATE todo SET category = '${requestBody.category}'WHERE id = ${todoId}`;
        await db.run(query);
        reCol = "Category Updated";
      }
      break;
    default:
      if (isValidDate(requestBody.dueDate) === true) {
        reCol = "Invalid Due Date";
        code = 400;
      } else {
        const date = dateFns(new Date(requestBody.dueDate), "yyyy-MM-dd");
        query = `UPDATE todo SET due_date = '${date}'WHERE id = ${todoId}`;
        await db.run(query);
        reCol = "Due Date Updated";
      }
  }
  response.status(code);
  response.send(reCol);
});

//Todo Delete
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `
    DELETE FROM todo
    WHERE id = ${todoId}
    `;
  await db.run(query);
  response.send("Todo Deleted");
});

module.exports = app;