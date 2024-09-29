Provide a README.md file with your project that describes any details of your project that you think the grader will need to understand how it works and how to use it. 
You can also use this file to talk about any design choices or trade-offs you made. 
At a minimum, the README.md file should mention the following information:

- The version of node you used to run this application.
- The browser (including version number) that you used to test this application.
- The version of PostgreSQL you used to create any databases.
- How to install, configure, and run the application.
- Any additional details the grader may need to run your code.
- Keep in mind that your grader may be unfamiliar with the problem domain. If you think that's a possibility, you may wish to add a brief discussion of the vocabulary and concepts used in the application.
- 

Please note your assumptions and decisions in the README.md file.

# PT Tracker Application by Frances Gray
I created a simple client tracker for private training coaches.
This was created to assist coaches keep track of multiple clients all with different physical backgrounds and goals in one place. 
It enables easy reference when creating a program for each client.
These client notes are private for only the coach to view, so internal notes on progress etc can also be made to assist with program creation. 
It assumes that the coach has a shared program with the client made another way. 
There is currently no way for users to be created via the application. 

Coaches must first login to view any page, since all pages are dependent on the which coach is logged in. 
If a user enters a url for a page without first logging in, they will be redirected to login. Once logged in they are redirected to the initial requested page.
Each coach has a list of clients. On the home page, these clients are sorted alphabetically by their first name with an indicator of how many goals each client has, and how many of these goals have been acheived.
Within each client profile, is their starting date. This is to inform the coach how long the client has been with them. 
There is also section for the coach to makes any general notes on the client
such as any injuries, medical history etc that are pertinent to their training experience. 
These notes are not required, and so the coach can keep all notes and add to them, or delete them and replace them as desired. 
Clients can be added (name is required, must be unique and under 100 characters), edited (name and notes), and deleted. If the user attempts to delete a client, a confirmation modal displays.
Each client has a list of goals. These goals are sorted by their creation date, assuming this is their order of priority, and whether they have been reached or not. 
The creation date of the goals cannot be changed via the application. This decision was made because if their creation date indicates their priority, editing it is not a useful feature. 
Each goal also has a dedicated feature for notes that can be added and edited by clicking on the goal once it has been created. 
This note section is for any updates on attempts, any incremental exercises done, or any other information
pertinent to the coach working with the client to acheive this specific goal. These notes are not required, and so the coach can keep all notes and add to them, or delete them and replace them as desired. 
Once the goal is completed, the coach can click the "done" button and it crosses out and moves to the botton of the list. 
Goals can be added(name is required), edited(name and notes), and deleted. If the user attempts to delete a goal, a confirmation modal is displayed. 
The client and goal page have a pagination of 5 objects per page. 

### Version information:
- Node: v16.20.0
- Browser used to test: Google Chrome, Version 119.0.6045.159 (Official Build) (x86_64)
- PostgreSQL: PostgreSQL 9.2.24 on x86_64-koji-linux-gnu, compiled by gcc (GCC) 7.3.1 20180712 (Red Hat 7.3.1-15), 64-bit

### How to install, configure, and run the application:
1. Go to pt_tracker folder in the terminal
2. Install npm and the packages and scripts: `npm install`
4. To start postgresql server, enter `sudo service postgresql start` in terminal
5. Create a database `pt_tracker` in psql: `createdb pt_tracker`
6. Create the database schema for the `pt_tracker` database using the schema.sql file: `psql pt_tracker < schema.sql`
7. Insert the seed data into the database from the lib folder, file name seed-data.sql: `psql pt_tracker < lib/seed-data.sql` 
8. In the pt_tracker folder, type `npm start` to start application

Note: passwords for the user's logins have been hashtaged using bcrypt. The original passwords are in comments next to the appropriate user in the seed-data file for the examiner's use. 

### Other notes:
Server connection information is in the file lib/db-query.js
I was using aws cloud9 to create and run the application. Server access information may need to be different for the examiner. 


