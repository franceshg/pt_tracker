INSERT INTO coaches (username, password)
VALUES ('Mr Big', '$2b$10$qMyWMQ223n6jLc4P3CMD9eYfPsmJB2KwyXNPJvYyIGbbRpR1B2/8a'), /*Password: MuscleMass0000*/
('Ms Strong', '$2b$10$2NAK8lU69Pb/4LzYM7E0Ru5fMDed9VZYUnV0xPtxD5W/0lKjan9Om'); /*Password: Password0000*/

INSERT INTO clients (name, start_date, notes, coach_username) 
VALUES ('Frances Gray', '2023-01-01', 'Long term goal: maintain level of fitness and mobility', 'Mr Big'),
('Dylan Jones', '2023-01-02', 'Long term goal: build muscle mass', 'Mr Big'),
('Harry Sue', '2023-01-10', 'Long term goal: maintain flexibility and movement with age', 'Mr Big');

INSERT INTO goals (title, notes, created_on, client_id, coach_username)
VALUES ('Run 5km', 'has pain in knees after extended jogging', '2023-01-01', 1, 'Mr Big'),
('Bench Press 50lbs','', '2023-01-03', 2, 'Mr Big'),
('Dead Lift 50lbs','', '2023-01-03', 2, 'Mr Big'),
('Squat 50lbs','', '2023-01-03', 2, 'Mr Big'),
('stairmaster for 30 minutes','', '2023-01-10', 3, 'Mr Big'),
('leg press 10lbs','', '2023-01-10', 3, 'Mr Big');
