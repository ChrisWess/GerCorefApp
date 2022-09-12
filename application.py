from app import application, config

if __name__ == '__main__':
    application.run(config.HOST, config.PORT, config.DEBUG)
