export function numberToWords(num: number): string {
    if (num === 0) return 'ZERO';

    const a = ['', 'ONE ', 'TWO ', 'THREE ', 'FOUR ', 'FIVE ', 'SIX ', 'SEVEN ', 'EIGHT ', 'NINE ', 'TEN ', 'ELEVEN ', 'TWELVE ', 'THIRTEEN ', 'FOURTEEN ', 'FIFTEEN ', 'SIXTEEN ', 'SEVENTEEN ', 'EIGHTEEN ', 'NINETEEN '];
    const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

    const inWords = (n: number): string => {
        if ((n = n.toString() as any - 0) < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
        if (n < 1000) return a[Math.floor(n / 100)] + 'HUNDRED ' + (n % 100 === 0 ? '' : 'AND ' + inWords(n % 100));
        if (n < 100000) return inWords(Math.floor(n / 1000)) + 'THOUSAND ' + (n % 1000 === 0 ? '' : inWords(n % 1000));
        if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'LAKH ' + (n % 100000 === 0 ? '' : inWords(n % 100000));
        return '';
    };

    return inWords(num).trim();
}
