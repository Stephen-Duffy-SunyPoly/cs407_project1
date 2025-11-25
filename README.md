# Fantastic Message Board
A simple message board system


## Setup
1. install nodejs
2. install mysql server
3. setup root access on the database
4. run the SQL quererys in `init_database_setup.sql` make sure to set a good account password
5. copy `.env.example` to `.env`
6. edit `.env` set the database password you created earlier in both the `DATABASE_URL` and `DATABASE_PASSWORD` fields. NOTE: make sure the password in the `DATABASE_URL` is URI encoded 
7. configure any other env changes
8. create the auto start service with the following service file. Make sure you change the file path to where you place this repo
```service
[Unit]
Descripton=Fantastic message board website service
After=network.target

[Service]
ExecStart=/path/to/project/run.sh

[Install]
WnatedBy=multi-user.target
```

## Running
```shell
./run.sh
```
