import React, { useState } from 'react'
import Input from '../custom/Input'
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import Button from '../custom/Button';
import TextArea from '../custom/TextArea';
import { createAvailabilityInquiry } from '@/services/availabilityForm';
import toast from 'react-hot-toast';

type AvailabilityFormTypes = {
  name: string;
  email: string;
  phone: string;
  message: string;
}

function ContactForAvailabilityBlock({
  listingDocumentId,
  serviceProviderDocumentId,
}: {
  listingDocumentId: string;
  serviceProviderDocumentId: string;
}) {

  const [submitting, setSubmitting] = useState(false);
  const { register, formState: { errors }, getValues } = useForm<AvailabilityFormTypes>();
  const t = useTranslations("contactForAvailabilityBlock");

  const onSubmit = async () => {
    if (!serviceProviderDocumentId) return;
    setSubmitting(true);
    try {
        const formData = getValues();
        await createAvailabilityInquiry({
          ...formData,
          serviceProvider: serviceProviderDocumentId,
          listingDocumentId: listingDocumentId,
          submissionStatus: "new"
        });
        toast.success(t('messages.success'));
    } catch (error) {
      console.error(error);
      toast.error(t('messages.error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className='flex flex-col items-center justify-center gap-2 p-4 rounded-xl shadow-sm bg-white'>

      <p className='text-2xl font-semibold text-primary text-center'>{t('formTitle')}</p>
      <p className='text-sm text-gray-500 text-center'>{t('formPurpose')}</p>

      <div className='w-full'>
        <Input
          type='text'
          label={t('name')}
          disabled={submitting}
          placeholder={t('namePlaceholder')}
          required
          {...register('name', { required: t('errors.nameRequired') })}
        />
        {errors.name && (
          <p className='text-red-500 text-sm mt-1'>
            {String(errors.name.message)}
          </p>
        )}
      </div>
      <div className='w-full'>
        <Input
          type='email'
          label={t('email')}
          disabled={submitting}
          placeholder={t('emailPlaceholder')}
          required
          {...register('email', { required: t('errors.emailRequired') })}
        />
        {errors.email && (
          <p className='text-red-500 text-sm mt-1'>
            {String(errors.email.message)}
          </p>
        )}
      </div>
      <div className='w-full'>
        <Input
          type='text'
          label={t('phone')}
          disabled={submitting}
          placeholder={t('phonePlaceholder')}
          required
          {...register('phone', { required: t('errors.phoneRequired') })}
        />
        {errors.phone && (
          <p className='text-red-500 text-sm mt-1'>
            {String(errors.phone.message)}
          </p>
        )}
      </div>
      <div className='w-full'>
        <TextArea
          label={t('message')}
          disabled={submitting}
          placeholder={t('messagePlaceholder')}
          required
          {...register('message', { required: t('errors.messageRequired') })}
        />
        {errors.message && (
          <p className='text-red-500 text-sm mt-1'>
            {String(errors.message.message)}
          </p>
        )}
      </div>
      <Button
        type='submit'
        disabled={submitting}
        onClick={onSubmit}
        style='primary'
      >
        {submitting ? t('submitting') : t('submit')}
      </Button>
    </div>
  )
}

export default ContactForAvailabilityBlock