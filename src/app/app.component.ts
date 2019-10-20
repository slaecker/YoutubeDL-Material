import { Component, OnInit } from '@angular/core';
import {PostsService} from './posts.services';
import {FileCardComponent} from './file-card/file-card.component';
import { Observable } from 'rxjs/Observable';
import {FormControl, Validators} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatSnackBar} from '@angular/material';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/mapTo';
import 'rxjs/add/operator/toPromise';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  determinateProgress = false;
  downloadingfile = false;
  audioOnly: boolean;
  urlError = false;
  path = '';
  url = '';
  exists = '';
  topBarTitle = 'Youtube Downloader';
  percentDownloaded: number;
  fileManagerEnabled = false;

  mp3s: any[] = [];
  mp4s: any[] = [];

  urlForm = new FormControl('', [Validators.required]);

  constructor(private postsService: PostsService, public snackBar: MatSnackBar) {
    this.audioOnly = false;



    this.postsService.loadNavItems().subscribe(result => { // loads settings
      const backendUrl = result['YoutubeDLMaterial']['Host']['backendurl'];
      this.topBarTitle = result['YoutubeDLMaterial']['Extra']['title_top'];
      this.fileManagerEnabled = result['YoutubeDLMaterial']['Extra']['file_manager_enabled'];

      this.postsService.path = backendUrl;
      this.postsService.startPath = backendUrl;
      this.postsService.startPathSSL = backendUrl;

      if (this.fileManagerEnabled) {
        this.getMp3s();
        this.getMp4s();
      }
    }, error => {
      console.log(error);
    });

  }
  /*

  doHandshake(url: string) {
    this.postsService.startHandshake(url).subscribe(theurl => {
      this.postsService.path = theurl;
      this.postsService.handShakeComplete = true;
      console.log('Handshake complete!');
    }, error => {
      console.log('Initial handshake failed on http.');
      this.doHandshakeSSL(url);
    });
  }

  doHandshakeSSL(url: string) {
    this.postsService.startHandshakeSSL(url).subscribe(theurl => {
      this.postsService.path = theurl;
      this.postsService.handShakeComplete = true;
      console.log('Handshake complete!');
    },
    error => {
      console.log('Initial handshake failed on https too! Make sure port 17442 is open.');
      this.postsService.handShakeComplete = false;
    });
  }*/

  getMp3s() {
    this.postsService.getMp3s().subscribe(result => {
      const mp3s = result['mp3s'];
      this.mp3s = mp3s;
    }, error => {
      console.log(error);
    });
  }

  getMp4s() {
    this.postsService.getMp4s().subscribe(result => {
      const mp4s = result['mp4s'];
      this.mp4s = mp4s;
    },
    error => {
      console.log(error);
    });
  }

  public goToFile(name, isAudio) {
    if (isAudio) {
      this.downloadHelperMp3(name);
    } else {
      this.downloadHelperMp4(name);
    }
  }

  public removeFromMp3(name: string) {
    for (let i = 0; i < this.mp3s.length; i++) {
      if (this.mp3s[i].id === name) {
        this.mp3s.splice(i, 1);
      }
    }
  }

  public removeFromMp4(name: string) {
    console.log(name);
    console.log(this.mp4s);
    for (let i = 0; i < this.mp4s.length; i++) {
      if (this.mp4s[i].id === name) {
        this.mp4s.splice(i, 1);
      }
    }
  }

  ngOnInit() {
  }

  downloadHelperMp3(name: string) {
    this.postsService.getFileStatusMp3(name).subscribe(fileExists => {
      const exists = fileExists;
      this.exists = exists[0];
      if (exists[0] === 'failed') {
        const percent = exists[2];
        console.log(percent);
        if (percent > 0.30) {
          this.determinateProgress = true;
          this.percentDownloaded = percent * 100;
        }
        setTimeout(() => this.downloadHelperMp3(name), 500);
      } else {
        window.location.href = this.exists;
      }
    });

  }

  downloadHelperMp4(name: string) {
    this.postsService.getFileStatusMp4(name).subscribe(fileExists => {
      const exists = fileExists;
      this.exists = exists[0];
      if (exists[0] === 'failed') {
        const percent = exists[2];
        if (percent > 0.30) {
          this.determinateProgress = true;
          this.percentDownloaded = percent * 100;
        }
        setTimeout(() => this.downloadHelperMp4(name), 500);
      } else {
        window.location.href = this.exists;
      }
    });

  }

  downloadClicked() {
    if (this.ValidURL(this.url)) {
      this.urlError = false;
      this.path = '';

      if (this.audioOnly) {
        this.downloadingfile = true;
        this.postsService.makeMP3(this.url).subscribe(posts => {
          this.path = posts['audiopathEncoded'];
          if (this.path !== '-1') {
            this.downloadHelperMp3(this.path);
          }
        }, error => { // can't access server
          this.downloadingfile = false;
          this.openSnackBar('Download failed!', 'OK.');
        });
      } else {
        this.downloadingfile = true;
        this.postsService.makeMP4(this.url).subscribe(posts => {
          this.path = posts['videopathEncoded'];
          if (this.path !== '-1') {
            this.downloadHelperMp4(this.path);
          }
        }, error => { // can't access server
          this.downloadingfile = false;
          this.openSnackBar('Download failed!', 'OK.');
      });
      }
    } else {
      this.urlError = true;
    }
  }

  ValidURL(str) {
    // tslint:disable-next-line: max-line-length
    const strRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/;
    const re = new RegExp(strRegex);
    return re.test(str);
  }

  public openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 2000,
    });
  }
}

