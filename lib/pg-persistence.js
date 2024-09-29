const { dbQuery } = require("./db-query");
const bcrypt = require("bcrypt");

module.exports = class PG_PERSISTENCE {
  constructor(session) {
  this.username = session.username; 
  }
  

  async authenticate(username, password) {
    const FIND_HASHED_PASSWORD = 'SELECT password FROM coaches WHERE username = $1';
    
    let result = await dbQuery(FIND_HASHED_PASSWORD, username);
    if (result.rowCount === 0) return false;
    
    return bcrypt.compare(password, result.rows[0].password);
  }
  
  async sortedClientList(page, limit) {
    let offset = (page - 1) * limit;
    const ALL_CLIENTS = 'SELECT * FROM clients ' + 
                        'WHERE coach_username = $1 ' +
                        'ORDER BY lower(name) ASC ' +
                        'LIMIT $2 OFFSET $3';
    const ALL_GOALS = 'SELECT * FROM goals WHERE coach_username = $1';
    
    let resultClientList = dbQuery(ALL_CLIENTS, this.username, limit, offset);
    let resultGoals = dbQuery(ALL_GOALS, this.username);
    let resultBoth = await Promise.all([resultClientList, resultGoals]);
    
    let allClients = resultBoth[0].rows;
    let allGoals = resultBoth[1].rows;
    if (!allClients || !allGoals) return undefined;
    
    allClients.forEach(client => {
      client.goals = allGoals.filter(goal => {
        return client.id === goal.client_id;
      });
    });
    
    return allClients;
  }
  
  async loadClient(clientId) {
        const FIND_CLIENT = 'SELECT * FROM clients ' + 
                        'WHERE coach_username = $1 ' +
                        'AND id = $2 ' +
                        'ORDER BY lower(name) ASC';
    const FIND_GOALS = 'SELECT * FROM goals WHERE coach_username = $1 AND client_id = $2 ORDER BY done ASC';
    
        let resultClient = dbQuery(FIND_CLIENT, this.username, clientId);
    let resultGoals = dbQuery(FIND_GOALS, this.username, clientId);
    let resultBoth = await Promise.all([resultClient, resultGoals]);
    
    let client = resultBoth[0].rows[0];
    if (!client) return undefined;
    
    client.goals = resultBoth[1].rows;
    client.start_date = client.start_date.toDateString();
    return client;
  }
  
  
  async loadClientWithPagination(clientId, page, limit) {
    let offset = (page - 1) * limit;
    
    const FIND_CLIENT = 'SELECT * FROM clients ' + 
                        'WHERE coach_username = $1 ' +
                        'AND id = $2 ' +
                        'ORDER BY lower(name) ASC';
    const FIND_GOALS = 'SELECT * FROM goals WHERE coach_username = $1 AND client_id = $2 ORDER BY done ASC, created_on ASC LIMIT $3 OFFSET $4';
    
    let resultClient = dbQuery(FIND_CLIENT, this.username, clientId);
    let resultGoals = dbQuery(FIND_GOALS, this.username, clientId, limit, offset);
    let resultBoth = await Promise.all([resultClient, resultGoals]);
    
    let client = resultBoth[0].rows[0];
    if (!client) return undefined;
    
    client.goals = resultBoth[1].rows;
    client.start_date = client.start_date.toDateString();
    return client;
  }
  
  async checkUniqueClientName(clientName) {
    const FIND_CLIENT = 'SELECT * FROM clients WHERE coach_username = $1 AND name = $2';
    
    let result = await dbQuery(FIND_CLIENT, this.username, clientName);
    return result.rowCount > 0;
  }
  
  async checkClientNameExists(clientName, clientId) {
    const FIND_CLIENT = 'SELECT * FROM clients WHERE coach_username = $1 AND name = $2 AND NOT id = $3';
    
    let result = await dbQuery(FIND_CLIENT, this.username, clientName, clientId);
    return result.rowCount > 0;
  }
  
  async createClient(clientName) {
    const INSERT_NEW_CLIENT = 'INSERT INTO clients (name, coach_username) ' +
                              'VALUES ($1, $2)';
    
    let result = await dbQuery(INSERT_NEW_CLIENT, clientName, this.username);
    return result.rowCount > 0;
  }
  
  async deleteClient(clientId) {
    const DELETE_CLIENT = 'DELETE FROM clients WHERE id = $1 AND coach_username = $2';
    
    let result = await dbQuery(DELETE_CLIENT, clientId, this.username);
    return result.rowCount > 0;
  }
  
  async setClientName(clientId, clientName) {
    const SET_NAME = 'UPDATE clients SET name = $1 WHERE id = $2 AND coach_username = $3';
    
    let result = await dbQuery(SET_NAME, clientName, clientId, this.username);
    return result.rowCount > 0;
  }
  
  async updateNotes(clientId, clientNotes) {
    const UPDATE_NOTES = 'UPDATE clients SET notes = $1 WHERE id = $2 AND coach_username = $3';
    
    let result = await dbQuery(UPDATE_NOTES, clientNotes, clientId, this.username);
    return result.rowCount > 0;
  }
  
  async checkGoalNameExists(goalName, clientId) {
    const FIND_GOAL = 'SELECT * FROM goals WHERE title = $1 AND coach_username = $2 AND client_id = $3';
    
    let result = await dbQuery(FIND_GOAL, goalName, this.username, clientId);
    return result.rowCount > 0;
  }
  
  async createNewGoal(clientId, goalName) {
    const NEW_GOAL = 'INSERT INTO goals(title, client_id, coach_username) VALUES ($1, $2, $3)';
    
    let result = await dbQuery(NEW_GOAL, goalName, clientId, this.username);
    return result.rowCount > 0;
  }

  
  async addNotesToGoal(newGoalNotes, clientId, goalTitle) {
    const ADD_NOTES = 'UPDATE goals SET notes = $1 WHERE title = $2 AND client_id = $3 AND coach_username = $4';
    
    let result = await dbQuery(ADD_NOTES, newGoalNotes, goalTitle, clientId, this.username);
    return result.rowCount > 0;
  }
  
  async loadGoal(clientId, goalId) {
    const FIND_GOAL = 'SELECT * FROM goals WHERE id = $1 AND client_id = $2 AND coach_username = $3';
    
    let result = await dbQuery(FIND_GOAL, goalId, clientId, this.username);
    if (!result) return undefined;
    
    return result.rows[0];
  }
  
  async deleteGoal(clientId, goalId) {
    const DELETE_GOAL = 'DELETE FROM goals WHERE id = $1 AND client_id = $2 AND coach_username = $3';
    
    let result = await dbQuery(DELETE_GOAL, goalId, clientId, this.username);
    return result.rowCount > 0;
    
  }
  
  async updateGoal(clientId, goalId, goalName) {
    const UPDATE_GOAL = 'UPDATE goals SET title = $1 WHERE client_id = $2 AND id = $3 AND coach_username = $4';
    
    let result = await dbQuery(UPDATE_GOAL, goalName, clientId, goalId, this.username);
    return result.rowCount > 0;
  }
  
  async updateDone(clientId, goalId) {
    let UPDATE_DONE = 'UPDATE goals SET done = NOT done WHERE id = $1 AND client_id = $2 AND coach_username = $3';
    
    let result = await dbQuery(UPDATE_DONE, goalId, clientId, this.username);
    return result.rowCount > 0;
  }
  
  async countNoOfClients() { 
    let numberOfClients = 'SELECT * FROM clients WHERE coach_username = $1';

    let result = await dbQuery(numberOfClients, this.username);
    return result.rowCount;
  }
  
    async countNoOfGoals(clientId) { 
    let numberOfGoals = 'SELECT * FROM goals WHERE client_id = $1 AND coach_username = $2';

    let result = await dbQuery(numberOfGoals, clientId, this.username);
    return result.rowCount;
  }
}