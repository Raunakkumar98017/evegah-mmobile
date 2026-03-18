import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { FaqService } from 'src/app/core/services/faq.service';

@Component({
  selector: 'app-faq-detail',
  templateUrl: './faq-detail.component.html',
  styleUrls: ['./faq-detail.component.scss'],
})
export class FaqDetailComponent implements OnInit {

  subscription: Subscription[] = [];
  faqDetail: any = null;
  questionDetails: Array<any> = [];

  constructor(
    private faqService: FaqService,
    public loadingController: LoadingController,
    public alertController: AlertController,
    public router: Router,
    public activatedRoute: ActivatedRoute
  ) { }

  ngOnInit() {
    this.getFAQsBySectionId();
  }

  getFAQsBySectionId() {

    this.showLoading();

    this.activatedRoute.queryParams.subscribe((params: any) => {

      const sectionId = Math.abs(+params.sectionId);
      const questionId = Math.abs(+params.questionId);

      this.subscription.push(
        this.faqService.getFAQsBySectionId(sectionId).subscribe((res: any) => {

          this.loadingController.dismiss();

          if (res.statusCode === 200) {
            this.faqDetail = res.data[0];
            this.questionDetails = this.parseQuestionsList(this.faqDetail.questionData, questionId);
          } else {
            this.showAlert(res.message);
          }

        })
      )

    });

  }

  parseQuestionsList(questionsList: Array<any>, questionId: number) {

    let questions = [];

    for (let index = 0; index < questionsList.length; index++) {

      let question = questionsList[index];

      if (questionId === +question.questionId) {
        question.isExpanded = true;
      } else {
        question.isExpanded = false;
      }

      questions.push(question);
    }

    return questions;

  }

  handleQuestionExpand(questionItem: any) {

    const id = questionItem.id;
    let index = this.questionDetails.findIndex((item) => item.id === id);

    if (index < 0) {
      return;
    }

    this.questionDetails[index].isExpanded = !this.questionDetails[index].isExpanded;

  }

  handleFaqLinkClick() {
    this.router.navigate(['home/faqs']);
  }

  convertRawTextToHTML(value: string) {
    const _value = value.replace(/\n|\s+\n/g, '<br>');
    return `<label>${_value}</label>`;
  }

  async showLoading() {
    await this.loadingController.create({
      message: 'Fetching FAQs.....',
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

}
