// La larghezza dei campi in un contenitore largo: il contenitore resta com'è, i campi
// no, perché a tutta riga un nome o una data sono difficili da leggere. Testo, email,
// password e tendine 384px; data, ora e numeri 176px; testo lungo la colonna di lettura.
export const FIELD_WIDTHS =
  '[&_[data-slot=input]]:max-w-sm [&_[data-slot=select-trigger]]:max-w-sm [&_input[type=date]]:max-w-44 [&_input[type=time]]:max-w-44 [&_input[type=number]]:max-w-44 [&_[data-slot=textarea]]:max-w-3xl'
