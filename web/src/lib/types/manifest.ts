import { OrderType } from "manifest/src/manifest";

export type FillLogResult = {
  /** Public key for the market as base58. */
  market: string;
  /** Public key for the maker as base58. */
  maker: string;
  /** Public key for the taker as base58. */
  taker: string;
  /** Number of base atoms traded. */
  baseAtoms: string;
  /** Number of quote atoms traded. */
  quoteAtoms: string;
  /** Price as float. Quote atoms per base atom. Client is responsible for translating to tokens. */
  priceAtoms: number;
  /** Boolean to indicate which side the trade was. */
  takerIsBuy: boolean;
  /** Boolean to indicate whether the maker side is global. */
  isMakerGlobal: boolean;
  /** Sequential number for every order placed / matched wraps around at u64::MAX */
  makerSequenceNumber: string;
  /** Sequential number for every order placed / matched wraps around at u64::MAX */
  takerSequenceNumber: string;
  /** Slot number of the fill. */
  slot: number;
  /** Signature of the tx where the fill happened. */
  signature: string;
};

/**
 * FillLogResult is the message sent to subscribers of the FillFeed
 */
export type PlaceOrderLogResult = {
  /** Public key for the market as base58. */
  market: string;
  /** Public key for the trader as base58. */
  trader: string;
  /** Number of base atoms traded. */
  baseAtoms: string;
  /** Number of quote atoms traded. */
  price: number;
  /** Sequential number for every order placed / matched wraps around at u64::MAX */
  orderSequenceNumber: string;
  /** Index of the order in the orderbook. */
  orderIndex: number;
  /** Slot number of the order. */
  lastValidSlot: number;
  /** Type of the order. */
  orderType: OrderType;
  /** Boolean to indicate whether the order is a bid. */
  isBid: boolean;
  /** Padding to make the account size 128 bytes. */
  padding: number[];

  /** Slot number of the fill. */
  slot: number;
  /** Signature of the tx where the fill happened. */
  signature: string;
};
