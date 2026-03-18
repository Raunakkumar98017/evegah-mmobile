import { IPayout } from '../../../interfaces/payment/payout/payout';

export class payoutModel implements IPayout {
    account_number!: string;
    amount!: number;
    currency!: string;
    mode!: string;
    purpose!: string;
    fund_account!: {
        account_type: string;
        bank_account: {
            name: string;
            ifsc: string;
            account_number: string;
        };
        contact: {
            name: string;
            email: string;
            contact: string;
            type: string;
            reference_id: string;
            notes: {
                notes_key_1: string;
                notes_key_2: string;
            };
        };
    };
    queue_if_low_balance!: boolean;
    reference_id!: string;
    narration!: string;
    notes!: {
        notes_key_1: string;
        notes_key_2: string;
    };
}