import { Component, OnInit } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { FaqService } from 'src/app/core/services/faq.service';

@Component({
  selector: 'app-faqs',
  templateUrl: './faqs.component.html',
  styleUrls: ['./faqs.component.scss'],
})
export class FaqsComponent implements OnInit {

  subscription: Subscription[] = [];
  faqs: Array<any> = [];
  searchQuery: string = '';
  displaySearchResults: boolean = false;
  faqQuestionsList: Array<any> = [];
  filteredQuestionsList: Array<any> = [];

  constructor(
    private faqService: FaqService,
    public loadingController: LoadingController,
    public alertController: AlertController,
    public router: Router
  ) { }

  ngOnInit() {
    this.getAllFAQs();
  }

  getAllFAQs() {

    this.showLoading();

    this.subscription.push(
      this.faqService.getAllFAQs().subscribe((res: any) => {

        this.loadingController.dismiss();

        if (res.statusCode === 200) {
          this.faqs = res.data;
          this.parseFAQs();
        } else {
          this.showAlert(res.message);
        }

      })
    )

  }

  parseFAQs() {

    for (let index = 0; index < this.faqs.length; index++) {
      const faqItem = this.faqs[index];
      this.faqQuestionsList.push(...faqItem.questionData);
    }

  }

  resetSearchBarStates() {
    this.displaySearchResults = false;
    this.filteredQuestionsList = [];
    this.searchQuery = '';
  }

  handleSectionClick(section: any) {
    const navigationExtras: NavigationExtras = {
      queryParams: {
        sectionId: section.id
      },
    };

    this.router.navigate(['home/faqDetail'], navigationExtras);
    this.resetSearchBarStates();

  }

  handleSearchInput(event: any) {
    const query = event.target.value.toLowerCase();
    this.searchQuery = query;

    if (this.searchQuery.length > 2) {
      this.displaySearchResults = true;
      this.filterFaqs(query);
    } else {
      this.displaySearchResults = false;
      this.filteredQuestionsList = [];
    }

  }

  filterFaqs(searchQuery: string) {

    this.filteredQuestionsList = this.faqQuestionsList.filter((item) => {

      if (item.question.toLowerCase().indexOf(searchQuery) > -1) {
        return true;
      } else if (item.sectionName.toLowerCase().indexOf(searchQuery) > -1) {
        return true;
      } else {
        return false;
      }

    });

  }

  handelSearchResultClick(searchResult: any) {

    this.resetSearchBarStates();

    const navigationExtras: NavigationExtras = {
      queryParams: {
        sectionId: searchResult.sectionId,
        questionId: searchResult.questionId
      },
    };

    this.router.navigate(['home/faqDetail'], navigationExtras);
  }

  onBack() {
    this.router.navigate(['home']);
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
