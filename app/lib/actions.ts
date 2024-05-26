'use server';

import {
  ZodError,
  // ZodIssue, 
  z
} from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

type FormState = {
  message: {
    customerId?: string,
    status?: string,
    amount?: string,
    other?: string
  },
}

const CreateInvoice = FormSchema.omit({ id: true, date: true });

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    if (error instanceof ZodError) {
      console.log('create error.issues', error.issues);
      console.log('create error.format', error.format());

      return {
        message: error.issues.reduce((obj, issue) => {
          obj[issue.path[0] as keyof FormState['message']] = "required field"

          return obj
        }, {} as FormState['message'])
      }
    }
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');

  // const rawFormData = {
  //   customerId: formData.get('customerId'),
  //   amount: formData.get('amount'),
  //   status: formData.get('status'),
  // };
  // Test it out:
  // console.log('rawFormData', rawFormData);
  // console.log('fromEntries', Object.fromEntries(formData.entries()));
}

export async function createInvoice1(_prevState: FormState | undefined, formData: FormData) {
  // safeParse
  const result = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!result.success) {
    // handle error then return
    console.log('result.error', result.error);
    return {
      message: result.error.issues.reduce((obj, issue) => {
        obj[issue.path[0] as keyof FormState['message']] = "required field"

        return obj
      }, {} as FormState['message'])
    }
  } else {
    const { customerId, amount, status } = result.data

    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    try {
      await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
      `;
    } catch (error) {
      return {
        message: {
          other: 'Database Error: Failed to Create Invoice.'
        }
      };
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  }
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;

  try {
    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
    return { message: 'Deleted Invoice.' };
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Invoice.' };
  }
}