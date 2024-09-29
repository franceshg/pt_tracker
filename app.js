const express = require("express");
const morgan = require("morgan");
const flash = require("express-flash");
const { body, validationResult } = require("express-validator");
const store = require("connect-loki");
const session = require("express-session");
const pg_persistence = require("./lib/pg-persistence");
const catchError = require("./lib/catch-error");
const itemsPerPage = 5;

const APP = express();
const HOST = "localhost";
const PORT = 8080;
const LOKI_STORE = store(session);

var originalUrl = '/';
//require user to be logged in to access a view
const requiresAuthentication = (req, res, next) => {
  originalUrl = req.originalUrl;
  if (!res.locals.signedIn) {
    res.redirect(302, "/users/signin");
  } else {
    next();
  }
}

APP.set("views", "./views");
APP.set("view engine", "pug");

APP.use(morgan("common"));
APP.use(express.static("public"));
APP.use(express.urlencoded({ extended: false }));
APP.use(session({
  cookie: {
    httpOnly: true,
    maxAge: 31 * 24 * 60 * 60 * 1000, // 31 days in millseconds
    path: "/",
    secure: false,
  },
  name: "launch-school-pttracker-session-id",
  resave: false,
  saveUninitialized: true,
  secret: "this is not very secure",
  store: new LOKI_STORE({}),
}));
APP.use(flash());

// Create a new datastore
APP.use((req, res, next) => {
  res.locals.store = new pg_persistence(req.session); 
  next();
});

// Extract flash session info
APP.use((req, res, next) => {
  res.locals.username = req.session.username;
  res.locals.signedIn = req.session.signedIn;
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

//Sign in Page
APP.get("/users/signin", (req, res) => {
  req.flash("info", "Please sign in.");
  res.render("signin", {
    flash: req.flash(),
  });
});

// Validate sign in 
APP.post("/users/signin", 
  catchError(async (req, res) => {
    let username = req.body.username.trim();
    let password = req.body.password;
    let authenticated = await res.locals.store.authenticate(username, password);
  
    if (!authenticated) {
      req.flash("error", "Invalid credentials");
      res.render("signin", {
        flash: req.flash(),
        username: username
      })
    } else {
      req.session.username = username;
      req.session.signedIn = true;
      req.flash("info", "Welcome!")
      res.redirect(originalUrl);
    }
  })
);

// sign user out
APP.post("/users/signout", (req, res) => {
  delete req.session.username;
  delete req.session.signedIn;
  
  res.redirect("/");
});

APP.get('/', requiresAuthentication, 
  catchError(async (req, res) => {
    let page = req.query.page ? Number(req.query.page) : 1;
    let numberOfClients = await res.locals.store.countNoOfClients();
    
    let totalPages = Math.ceil(numberOfClients / itemsPerPage) === 0 ? 1 : Math.ceil(numberOfClients / itemsPerPage);
    let clientList = await res.locals.store.sortedClientList(page, itemsPerPage);
    
    let clientsInfo = clientList.map(client => ({
      countAllGoals: client.goals.length,
      countDoneGoals: client.goals.filter(goal => goal.done).length,
    }))
    
    if (page > totalPages) throw new Error("Not Found");
    
    res.render("home", {
      totalPages,
      page,
      clientList,
      clientsInfo
    });
}));

APP.get('/new_client', requiresAuthentication, 
  catchError(async(req, res) => {
    res.render("new_client");
  })
);

APP.post('/', 
  [
    body("clientName")
      .trim()
      .isLength({ min: 1})
      .withMessage("Client name is required")
      .isLength({ max: 100 })
      .withMessage("Client name cannot be longer than 100 characters")
  ],
  catchError(async(req, res, next) => {
    let errors = validationResult(req);
    let clientName = req.body.clientName;
    
    if (!errors.isEmpty()) {
      errors.array().forEach(message => req.flash("error", message.msg));
      res.render("new_client", {
        clientName,
        flash: req.flash()
      })
    } else if (await res.locals.store.checkUniqueClientName(clientName)) {
      req.flash("error", "The client's name must be unique");
      res.render("new_client", {
        clientName,
        flash: req.flash()
      })
    } else {
      let createdClient = await res.locals.store.createClient(clientName);
      if (!createdClient) {
        next(new Error()); // IS THIS NECESSARY?? vs cATCHERROR, goes to bottom error handler and logs to console and sends to client screen
      } else {
        req.flash("success", "Client has been created")
        res.redirect("/")
      }
    }
  })
);


APP.get('/:client_id', requiresAuthentication,
  catchError(async(req, res) => {
    let clientId = req.params.client_id;
    let page = req.query.page ? Number(req.query.page) : 1;
    let client = await res.locals.store.loadClientWithPagination(+clientId, page, itemsPerPage);
    let totalPages = Math.ceil(await res.locals.store.countNoOfGoals(+clientId) / itemsPerPage);

    if (page > totalPages && totalPages !== 0) throw new Error("Not Found");
    
    res.render("client", {
      page,
      totalPages,
      client
    });
  })
);

APP.get('/:client_id/edit', requiresAuthentication,
  catchError(async(req, res) => {
    let clientId = req.params.client_id;
    let client = await res.locals.store.loadClient(+clientId);
    if (!client) throw new Error("Not Found")
    
    res.render("edit_client", { 
      client 
    });
  })
);

APP.post('/:client_id/delete',
  catchError(async(req, res) => {
    let clientId = req.params.client_id;
    let deletedClient = await res.locals.store.deleteClient(+clientId);
    if (!deletedClient) throw new Error("Not Found"); // doing something??
    
    req.flash("success", "Client has been deleted");
    res.redirect('/');
  })
);

APP.post('/:client_id/edit', 
  [
    body("clientName")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Client name is required")
      .isLength({ max:100 })
      .withMessage("Client name must be less than 100 characters"),
    body("clientNotes")
      .trim()
  ],
  catchError(async(req, res) => {
    let errors = validationResult(req);
    
    let clientId = req.params.client_id;
    let clientName = req.body.clientName;
    let clientNotes = req.body.clientNotes;
    
    let client = await res.locals.store.loadClient(+clientId);

    if (!errors.isEmpty()) {
      errors.array().forEach(message => req.flash("error", message.msg));
      res.render("edit_client", {
        flash: req.flash(),
        client
      });
    } else if (await res.locals.store.checkClientNameExists(clientName, +clientId)) {
      req.flash("error", "The client name must be unique");
      res.render("edit_client", {
        flash: req.flash(),
        client
      });
    } else {
      let updatedClientName = await res.locals.store.setClientName(+clientId, clientName)
      if (!updatedClientName) throw new Error("Not Found") // doing something?? 
      let updatedNotes = await res.locals.store.updateNotes(+clientId, clientNotes);
      if (!updatedNotes) throw new Error("Not Found");
      
      req.flash("success", "Client updated");
      res.redirect(`/${clientId}`);
    }
  })
);

// APP.post('/:client_id/edit_notes', 
//   [
//     body("clientNotes")
//       .trim()
//   ],
//   catchError(async(req, res) => {
//     let clientId = req.params.client_id;
//     let clientNotes = req.body.clientNotes;
//     let updatedNotes = await res.locals.store.updateNotes(+clientId, clientNotes);

//     if (!updatedNotes) throw new Error("Not Found");
    
//     req.flash("success", "Client notes updated");
//     res.redirect(`/${clientId}`);
    
//   })
// );

APP.post('/:client_id/:goal_id/edit', 
  [
    body("goalName")
      .trim()
      .isLength({ min:1 })
      .withMessage("Goal Name is required")
      .isLength({ max:100 })
      .withMessage("Goal Name must be under 100 characters"),
    body("goalNotes")
    .trim()
  ],
  catchError(async(req, res) => {
    let goalName = req.body.goalName;
    let goalNotes = req.body.goalNotes;
    let clientId = req.params.client_id;
    let goalId = req.params.goal_id;
    let goal = await res.locals.store.loadGoal(+clientId, +goalId);
    let client = await res.locals.store.loadClient(+clientId);
    
    let errors = validationResult(req);
    if(!errors.isEmpty()) {
      errors.array().forEach(message => req.flash("error", message.msg));
      res.render("edit_goal", {
        client,
        goalNotes,
        goal,
        flash: req.flash(),
      })
    } else {
      let goalUpdated = await res.locals.store.updateGoal(+clientId, +goalId, goalName);
      if (!goalUpdated) throw new Error("Not Found");
      let goalNotesUpdated = await res.locals.store.addNotesToGoal(goalNotes, +clientId, goal.title)
      if (!goalNotesUpdated) throw new Error("Not Found")
      
      req.flash("success", "Goal updated");
      res.redirect(`/${clientId}`) 
    }
  })
);

APP.post('/:client_id/add_goal',
  [
    body("newGoal")
      .trim()
      .isLength({ min: 1})
      .withMessage("Goal name is required"),
    body("newGoalNotes")
      .trim()
  ],
  catchError(async(req, res) => {
    let clientId = req.params.client_id;
    let newGoalName = req.body.newGoal;
    let newGoalNotes = req.body.newGoalNotes;
    let page = req.query.page ? Number(req.query.page) : 1;
    let totalPages = Math.ceil(await res.locals.store.countNoOfGoals(+clientId) / itemsPerPage);
    let client = await res.locals.store.loadClientWithPagination(+clientId, page, itemsPerPage);
    let errors = validationResult(req);

    if(!errors.isEmpty()) {
      errors.array().forEach(message => req.flash("error", message.msg));
      res.render("client", {
        page,
        totalPages,
        client,
        flash: req.flash(),
        newGoalName
      })
    } else if (await res.locals.store.checkGoalNameExists(newGoalName, clientId)) {
      req.flash("error", "The goal title must be unique");
      res.render("client", {
        newGoalName,
        flash: req.flash(),
        client,
        page,
        totalPages,
      })
    } else {
      let goalCreated = await res.locals.store.createNewGoal(clientId, newGoalName);
      if (!goalCreated) throw new Error("Not Found");
      let addedNotes = await res.locals.store.addNotesToGoal(newGoalNotes, clientId, newGoalName);
      if (!addedNotes) throw new Error("Not Found");
      
      req.flash("success", "Goal created");
      res.redirect(`/${clientId}`)
    }
  })
);

APP.get('/:client_id/:goal_id/edit_goal', requiresAuthentication,
  catchError(async(req, res) => {
    let clientId = req.params.client_id;
    let client = await res.locals.store.loadClient(+clientId);
    let goalId = req.params.goal_id;
    let goal = await res.locals.store.loadGoal(clientId, goalId);
    res.render("edit_goal", {
      goal,
      client
    })
  })
);


APP.post('/:client_id/:goal_id/delete', 
  catchError(async(req, res) => {
    let clientId = req.params.client_id;
    let goalId = req.params.goal_id;
    let deletedGoal = await res.locals.store.deleteGoal(+clientId, +goalId);
    if (!deletedGoal) throw new Error("Not Found"); // doing something??
    
    req.flash("success", "Goal has been deleted");
    res.redirect(`/${clientId}`);
  }))


APP.post('/:client_id/:goal_id/toggle',
  catchError(async(req, res) => {
    let clientId = req.params.client_id;
    let goalId = req.params.goal_id;
    let updatedDone = await res.locals.store.updateDone(+clientId, +goalId);
    
    if (!updatedDone) throw new Error("Not Found");
    
    let goal = await res.locals.store.loadGoal(+clientId, +goalId);
    if (goal.done) {
      req.flash("success", `${goal.title} is complete!`);
    } else {
      req.flash("success", `${goal.title} marked incomplete`)
    }
    res.redirect(`/${clientId}`);
  }))
// Error handler
APP.use((err, req, res, _next) => {
  console.log(err); // Writes more extensive information to the console log
  res.status(404).send('Not Found');
});

APP.listen(PORT, HOST, () => {
  console.log(`Todos is listening on port ${PORT} of ${HOST}!`);
});
