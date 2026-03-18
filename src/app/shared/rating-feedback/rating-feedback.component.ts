import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import messageConstants from 'src/app/core/constants/message-constants';

import { RatingFeedbackService } from 'src/app/core/services/rating-feedback.service';

@Component({
  selector: 'app-rating-feedback',
  templateUrl: './rating-feedback.component.html',
  styleUrls: ['./rating-feedback.component.scss'],
})
export class RatingFeedbackComponent implements OnInit, OnChanges, OnDestroy {

  @Input() feedbackSubmitted!: boolean;
  @Input() rideBookingId!: string;
  @Input() rideDetails!: string;
  @Output() onSkip = new EventEmitter();
  @Output() onSubmit = new EventEmitter();

  starRatingArray = [
    {
      count: 1,
      emoji: '😠',
      label: 'Very Bad'
    },
    {
      count: 2,
      emoji: '😞',
      label: 'Poor'
    },
    {
      count: 3,
      emoji: '😐',
      label: 'Average'
    },
    {
      count: 4,
      emoji: '😃',
      label: 'Good'
    },
    {
      count: 5,
      emoji: '🤩',
      label: 'Excellent'
    }
  ];
  rating = 0;
  feedback: string = '';
  subscription: Subscription[] = [];
  _rideDetails: any = null;
  _feedbackSubmitted = false;
  showStaticContent = false;

  constructor(
    public alertController: AlertController,
    public loadingController: LoadingController,
    private ratingFeedbackService: RatingFeedbackService
  ) { }

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges): void {

    const rideDetailsChanges = changes['rideDetails'];
    const feedbackSubmittedChanges = changes['feedbackSubmitted'];

    if (rideDetailsChanges) {

      this._rideDetails = rideDetailsChanges.currentValue || {};

      if (!this._rideDetails?.commentsReplyStatusName) {
        this.showStaticContent = false;
      } else {
        this.showStaticContent = true;
      }

    }

    if (feedbackSubmittedChanges) {
      this._feedbackSubmitted = feedbackSubmittedChanges.currentValue;
    }

  }

  ratingHandler(ratingItem: any) {
    this.rating = ratingItem.count;
  }

  skipHandler(event: any) {
    this.onSkip.emit(event);
  }

  submitFeedbackHandler() {

    if (this.rating === 0) {
      return this.showAlert(messageConstants.mandatoryRating);
    }

    this.showLoading();

    const params = {
      rideRating: this.rating,
      rideComments: this.feedback,
      rideBookingId: this.rideBookingId
    };

    this.subscription.push(
      this.ratingFeedbackService.addRatingFeedback(params).subscribe((res: any) => {

        this.loadingController.dismiss();

        if (res.statusCode === 200) {
          const buttons = [
            {
              text: 'Ok',
              handler: () => {
                this.onSubmit.emit();
              }
            }
          ];
          this.showAlert(messageConstants.thanksForFeedback, buttons);
        } else {
          this.showAlert(res.message);
        }

      })
    );
  }

  async showLoading() {
    await this.loadingController.create({
      message: 'Submitting Feedback.....',
      cssClass: 'loader-css-class',
    }).then((response) => {
      response.present();
    });
  }

  async showAlert(message: string, buttons?: any) {

    const alert = await this.alertController.create({
      header: 'Alert',
      message,
      buttons: buttons || ['OK'],
    });

    await alert.present();

  }

  ngOnDestroy(): void {
    this.subscription.forEach((subscription) => subscription.unsubscribe());
    this.safeDismissLoading();
    this.safeDismissAlert();
  }

  private async safeDismissLoading() {
    try {
      await this.loadingController.dismiss();
    } catch {
      // no-op when overlay is already dismissed/not created
    }
  }

  private async safeDismissAlert() {
    try {
      await this.alertController.dismiss();
    } catch {
      // no-op when overlay is already dismissed/not created
    }
  }

}
