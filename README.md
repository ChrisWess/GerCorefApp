# GerCorefApp

This is a project of the University of Hamburg. The GerCorefApp is a coreference visualization and annotation tool.

## Authors

- [@Swetlana Shaban](https://github.com/SwetlanaShaban)
- [@Christoph Wessarges](https://github.com/ChrisWess)
- [@Moritz Wegner](https://github.com/MoWe97)


## Acknowledgements
This Web-App uses a neural network in the backend to annotate german text.  
 - [The neural network used for auto annotation](https://github.com/uhh-lt/neural-coref)
 - [@Hans Ole Hatzel](https://github.com/hatzel)
 - [@Fynn Petersen-Frey](https://github.com/fynnos)


## How to run the app

### Backend
First you will need to be able to run the `python Flask` backend:
 - Install Python3 dependencies: `pip install -r requirements.txt TODO`.
 - Download the models weights `droc_incremental_no_segment_distance.mar` from [this page](https://github.com/uhh-lt/neural-coref/releases).
 - Extract the `model*.bin`, create a new directory `GerCorefApp/app/coref/base/model_saves` and place the .bin file in that directory.
 - move to the `GerCorefApp`-directory.
 - start the backend with `python3 application.py`.
 - The application persists its data on a `MongoDB` cluster, which should be started on the default port (27017) during development.
 - The Flask server will be started on http:localhost:5000 by default, which can be changed by setting the environment variables `SERVER_HOST` and `SERVER_PORT`.
 - Furthermore, all relevant configurations for the database and Flask backend can be set or found in `GerCorefApp/config.py`.
 - look [here](https://github.com/uhh-lt/neural-coref) if you still have any trouble setting the backend up.

### Frontend
If the backend is running, the application is ready to be started. 
 - Move to the `GerCorefApp/coref-app`-directory.
 - Run `npm install` to install all required packages.
 - Run `npm start` to start the development server to test out the React Frontend locally.
 - For more info, see the `README.md` in `GerCorefApp/coref-app`.

## Demo

