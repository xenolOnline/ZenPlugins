import { ScrapeFunc, Account, ExtendedTransaction } from '../../types/zenmoney'
import { parseAccounts, fetchTransactions, fetchBalance } from './api'
import { convertToZenMoneyAccount, convertToZenMoneyTransaction, injectAccountInfo } from './converters'
import { AccountRecord, Preferences } from './models'
import { adjustTransactions } from '../../common/transactionGroupHandler'

export const scrape: ScrapeFunc<Preferences> = async ({ preferences, fromDate, toDate }) => {
  toDate = toDate ?? new Date()

  const accounts = parseAccounts(preferences)
  const zenAccounts: Account[] = []

  let records: AccountRecord[] = []

  for (const account of accounts) {
    if (ZenMoney.isAccountSkipped(account.id)) {
      continue
    }

    const balanceResponse = await fetchBalance(preferences, account)
    account.balance = balanceResponse.CurrentBalance
    zenAccounts.push(convertToZenMoneyAccount(account))

    const statement = await fetchTransactions(preferences, account, fromDate, toDate)
    const accountRecords = injectAccountInfo(statement.Records, account)
    records = records.concat(accountRecords)
  }

  const transactions: ExtendedTransaction[] = []
  for (const record of records) {
    transactions.push(convertToZenMoneyTransaction(record, records))
  }

  return {
    accounts: zenAccounts,
    transactions: adjustTransactions({ transactions })
  }
}
