import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

export const StatusEnum = (t) => ({
    0: {
        code: 'NotActivated',
        label: t("NotActivated"),
        colorClass: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: <Clock className="w-4 h-4" />
    },
    1: {
        code: 'Activated',
        label: t("Activated"),
        colorClass: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className="w-4 h-4" />
    },
    2: {
        code: 'Disabled',
        label: t("Disabled"),
        colorClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <XCircle className="w-4 h-4" />
    },
    3: {
        code: 'Erased',
        label: t("Erased"),
        colorClass: 'bg-red-100 text-red-800 border-red-200',
        icon: <AlertCircle className="w-4 h-4" />
    }
});

export const FiscalDeviceTypeEnum = (t) => ({
    0: {
        code: 'NotFiscal',
        label: t("NotFiscal"),
        value: 0
    },
    1: {
        code: 'SI_DE_imprimante_fiscale',
        label: t("SI_DE_imprimante_fiscale"),
        value: 1
    },
    2: {
        code: 'SI_DE_fara_imprimante_fiscale',
        label: t("SI_DE_fara_imprimante_fiscale"),
        value: 2
    },
    3: {
        code: 'SI_FDE_fara_imprimante_fiscale',
        label: t("SI_FDE_fara_imprimante_fiscale"),
        value: 3
    },
    4: {
        code: 'Masina_de_casa_si_control',
        label: t("Masina_de_casa_si_control"),
        value: 4
    }
});

export const CashRegisterTypes = {
    0: {
        label: 'CashRegister',
        value: 0
    },
    1: {
        label: 'PaymentTerminal',
        value: 1
    },
    2: {
        label: 'CashRegisterService',
        value: 2
    },
};

export const FiscalDeviceBusinessTypeEnum = (t) => ( {
    0: {
        code: 'NotSet',
        label: t("NotSet"),
        value: 0
    },
    1: {
        code: 'Petrol',
        label: 'Petrol',
        value: 1
    },
    2: {
        code: 'Sales',
        label: 'Sales',
        value: 2
    },
    3: {
        code: 'PetrolAndSales',
        label: 'PetrolAndSales',
        value: 3
    },
    4: {
        code: 'Taxi',
        label: 'Taxi',
        value: 4
    },
    5: {
        code: 'Gambling',
        label: 'Gambling',
        value: 5
    }
});
