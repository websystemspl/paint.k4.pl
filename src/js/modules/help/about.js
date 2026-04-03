import config from './../../config.js';
import Dialog_class from './../../libs/popup.js';

class Help_about_class {

	constructor() {
		this.POP = new Dialog_class();
	}

	//about
	about() {
		var email = 'biuro@web-systems.pl';	
		
		var settings = {
			title: 'About',
			params: [
				{title: "", html: '<img style="width:64px;" class="about-logo" alt="" src="images/logo-k4.svg" />'},
				{title: "Name:", html: '<span class="about-name">paint.k4.pl</span>'},
				{title: "Version:", value: VERSION},
				{title: "Description:", value: "Edytor obrazów online."},
				{title: "Author:", value: 'Web Systems'},
				{title: "Email:", html: '<a href="mailto:' + email + '">' + email + '</a>'},
				{title: "GitHub:", html: '<a href="https://github.com/websystemspl/paint.k4.pl">https://github.com/websystemspl/paint.k4.pl</a>'},
				{title: "Website:", html: '<a href="https://www.web-systems.pl/">https://www.web-systems.pl/</a>'},
				{title: "Credits:", value: 'Based on miniPaint (MIT License) by ViliusL.'},
			],
		};
		this.POP.show(settings);
	}

}

export default Help_about_class;
