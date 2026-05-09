## Dataset links:

1. Live Flight Tracking related datasets (2021-12-06):
   https://opensky-network.org/datasets/#states/2021-12-06/

2. Flight related datasets (2021-12):
   https://opensky-network.org/datasets/#metadata/ (download the file with name: aircraft-database-complete-2021-12.csv)

3. Airports datasets (download the airports.csv file from here):
   https://github.com/nanguoyu/OpenFlight/tree/master

<br />
<br />

## Steps to run the script

1. add env variables in the .env file

```
MONGODB_URI="mongodb://127.0.0.1:27017"
MONGODB_DATABASE_NAME="opensky_dataset"
```

2. add the new folder at the root of the project with name "datasets". inside datasets folder add the folders respectively with name: "live_tracking_datasets", "flights" and "airports". both folders will have the csv files downloaded from the above mentioned link.

3. from the "dataset-migration service" run the desired script by uncommenting the respective function.

4. run the command to start the "dataset-migration" service.

```
npm run start:migration_script
```
