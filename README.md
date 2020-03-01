# YoutubeDL-Material

YoutubeDL-Material is a Material Design frontend for [youtube-dl](https://rg3.github.io/youtube-dl/). It's coded using [Angular 8](https://angular.io/) for the frontend, and [Node.js](https://nodejs.org/) on the backend.

Now with [Docker](#Docker) support!

## Getting Started

Check out the prerequisites, and go to the installation section. Easy as pie!

Here's an image of what it'll look like once you're done:

![frontpage](https://i.imgur.com/rOxWIys.png)

With optional file management enabled (default):

![frontpage_with_files](https://i.imgur.com/UTUROLl.png)

Dark mode:

![dark_mode](https://i.imgur.com/9TMkHF6.png?1)

### Prerequisites

NOTE: If you would like to use Docker, you can skip down to the [Docker](#Docker) section for a setup guide.

You need to have a functioning web server for this to work. Also make sure you have these dependencies installed on your system: nodejs and youtube-dl. If you don't, run this command:

```
sudo apt-get install nodejs youtube-dl
```

### Installing

1. First, download the [latest release](https://github.com/Tzahi12345/YoutubeDL-Material/releases/latest)!

2. Drag the `youtubedl-material` directory to an easily accessible directory. Navigate to the `config` folder and edit the `default.json` file. If you're using SSL encryption, look at the `encrypted.json` file for a template.

NOTE: If you are intending to use a reverse proxy, this next step is not necessary
3. Port forward the port listed in `default.json`, which defaults to `17442`.

4. Once the configuration is done, run `npm install` to install all the backend dependencies. Once that is finished, type `nodejs app.js`. This will run the backend server, which serves the frontend as well. On your browser, navigate to to the server (url with the specified port). Try putting in a youtube link to see if it works. If it does, viola! YoutubeDL-Material is now up and running.

If you experience problems, know that it's usually caused by a configuration problem. The first thing you should do is check the console. To get there, right click anywhere on the page and click "Inspect element." Then on the menu that pops up, click console. Look at the error there, and try to investigate.

### Configuration

NOTE: If you are using YoutubeDL-Material v3.2 or lower, click [here](https://github.com/Tzahi12345/YoutubeDL-Material/blob/b87a9f1e2fd896b8e3b2f12429b7ffb15ea4521b/README.md#configuration) for the old README

Here is an explanation for the configuration entries. Check out the [default config](https://github.com/Tzahi12345/YoutubeDL-Material/blob/master/backend/config/default.json) for more context.

| Config item | Description | Default |
| ------------- | ------------- | ------------- |
| url  | URL to the server hosting YoutubeDL-Material | "http://example.com" |
| port  | Desired port for YoutubeDL-Material | "17442" |
| use-encryption | true if you intend to use SSL encryption (https) | false |
| cert-file-path | Cert file path - required if using encryption | "/etc/letsencrypt/live/example.com/fullchain.pem" |
| key-file-path | Private key file path - required if using encryption |  "/etc/letsencrypt/live/example.com/privkey.pem" |
| path-audio | Path to audio folder for saved mp3s | "audio/" |
| path-video | Path to video folder for saved mp4s | "video/" |
| title_top | Title shown on the top toolbar | "Youtube Downloader" |
| file_manager_enabled | true if you want to use the file manager | true |
| allow_quality_select | true if you want to select a videos quality level before downloading | true |
| download_only_mode | true if you want files to directly download to the client with no media player | false |
| allow_multi_download_mode | true if you want the ability to download multiple videos at the same time | true |
| use_youtube_API | true if you want to use the Youtube API which is used for YT searches | false |
| youtube_API_key | Youtube API key. Required if use_youtube_API is enabled | "" |
| default_theme | Default theme to use. Options are "default" and "dark" | "default" |
| allow_theme_change | true if you want the icon in the top toolbar that toggles dark mode | true |
| use_default_downloading_agent | true if you want to use youtube-dl's default downloader | true |
| custom_downloading_agent | If not using the default downloader, this is the downloader you want to use | "" |
| allow_advanced_download | true if you want to use the Advanced download options | false |

## Deployment

If you'd like to install YoutubeDL-Material, go to the Installation section. If you want to build it yourself and/or develop the repository, then this section is for you.

To deploy, simply clone the repository, and go into the `youtubedl-material` directory. Type `npm install` and all the dependencies will install. Then type `cd backend` and again type `npm install` to install the dependencies for the backend.

Once you do that, you're almost up and running. All you need to do is edit the configuration in `youtubedl-material/config`, go back into the `youtubedl-material` directory, and type `ng build --prod`. This will build the app, and put the output files in the `youtubedl-material/dist` folder. Drag those files into the `public` directory in the `backend` folder.

The frontend is now complete. The backend is much easier. Just go into the `youtubedl-material` folder, and type `nodejs app.js`.

Finally, port forward the port specified in the config (defaults to `17442`) and point it to the server's IP address. Make sure the port is also allowed through the server's firewall.

## Docker

If you are looking to setup YoutubeDL-Material with Docker, this section is for you. And you're in luck! Docker setup is quite simple.

1. Run `curl -L https://github.com/Tzahi12345/YoutubeDL-Material/releases/latest/download/docker-compose.yml -o docker-compose.yml` to download the latest release of `docker-compose.yml`, or go to the [releases](https://github.com/Tzahi12345/YoutubeDL-Material/releases/) page to grab the version you'd like.
2. Modify the config items in the `environment` section of `docker-compose.yml` to your liking. The default options will work, however, and point to `http://localhost:8998`. You can find an explanation of these configuration items in [Configuration](#Configuration) section. 
3. Run `docker-compose pull`. This will download the official YoutubeDL-Material docker image.
4. Run `docker-compose up` to start it up. If successful, it should say "HTTP(S): Started on port 8998" or something similar. 
5. Make sure you can connect to the specified URL + port, and if so, you are done!

## Contributing

Feel free to submit a pull request! I have no guidelines as of yet, so no need to worry about that.

## Authors

* **Isaac Grynsztein** (me!) - *Initial work*

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* youtube-dl
* [AllTube](https://github.com/Rudloff/alltube) (for the inspiration)
