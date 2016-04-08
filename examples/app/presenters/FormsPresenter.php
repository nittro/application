<?php
/**
 * Created by PhpStorm.
 * User: danik
 * Date: 08/04/16
 * Time: 17:18
 */

namespace App\Presenters;


use Nette\Application\UI\Form;

class FormsPresenter extends BasePresenter {


    public function doSendMessage(Form $form, $message) {
        $this->template->message = $message;
        $this->redrawControl('message');

    }


    public function createComponentContactForm() {
        $form = new Form();

        $form->addText('name', 'Your name:')
            ->setRequired();

        $form->addText('email', 'Your e-mail:')
            ->setType('email')
            ->addRule(Form::EMAIL, 'That doesn\'t look like a proper e-mail address. Please check your e-mail address for typos and send the form again.');

        $form->addText('phone', 'Your phone number:')
            ->setType('tel')
            ->addRule(Form::PATTERN, 'Please specify your phone number in the international format', '(00|\+)[\d\s]+');

        $form->addRadioList('preferred', 'Preferred contact:', ['phone' => 'Phone', 'email' => 'E-mail'])
            ->setRequired();

        $subjects = [
            'general' => 'General Questions',
            'complaint' => 'Quality of Service Complaints',
            'idea' => 'Ideas for Improvement',
        ];

        $form->addSelect('topic', 'Message topic:', $subjects)
            ->setRequired();

        $form->addTextArea('content', 'Your message:', 40, 4)
            ->setRequired();

        $form->addUpload('attachments', 'Attachments (only JPEG images allowed):', true)
            ->addCondition(Form::FILLED)
            ->addRule(Form::MIME_TYPE, 'Only JPEG images are allowed', 'image/jpeg');

        $newsletters = [
            'weekly' => 'Weekly reports',
            'promo' => 'Promotional bulletins',
            'ads' => 'Interesting offers',
        ];

        $form->addCheckboxList('subscribe', 'Subscribe to:', $newsletters);

        $form->addCheckbox('terms', 'I agree to the terms and conditions')
            ->setOmitted()
            ->setRequired();

        $form->addSubmit('send', 'Send message');

        $form->onSuccess[] = [$this, 'doSendMessage'];

        return $form;

    }

}
