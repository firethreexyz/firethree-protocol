import { PublicKey } from '@solana/web3.js'
import { Program } from '@coral-xyz/anchor'
import { Firethree } from './types/firethree'
import { Wallet } from './types/wallet'
import { Project } from './types/project'
import { ShdwDrive } from '@shadow-drive/sdk'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'
import shadowVerifyAccount from './utils/shadowVerifyAccount'
import { GENESYSGO_URL } from './constants/storage'
var cookies = require('browser-cookies')

export default class Analytics {
  program: Program<Firethree>
  wallet: Wallet
  project: Project
  shdwDrive: ShdwDrive

  constructor(program: Program<Firethree>, wallet: Wallet, project: Project) {
    this.program = program
    this.wallet = wallet
    this.project = project

    this.initShdwDrive()
  }

  private async initShdwDrive() {
    this.shdwDrive = await new ShdwDrive(
      this.program.provider.connection,
      this.wallet
    ).init()
  }

  private async getUserDataByIp() {
    const response = await axios.get('http://ip-api.com/json')

    if (!response.data || response.data.status !== 'success') {
      return
    }

    return {
      lat: response.data.lat as number,
      lng: response.data.lon as number,
      country: response.data.country as string,
      countryCode: response.data.countryCode as string,
      zip: response.data.zip as string,
      region: response.data.region as string
    }
  }

  /**
   * Setup Analytics
   * Track default events
   */
  public async setup() {
    if (!window) {
      return
    }

    this.trackEvent('page_view', {
      ts: Date.now(),
      pathname: window.location.pathname
    })

    const userDataByIp = await this.getUserDataByIp()

    if (cookies.get('userId') && !cookies.get('locationTracked')) {
      this.trackEvent('user_view', {})

      this.trackEvent('location', { ...userDataByIp })
      cookies.set('locationTracked', true, { expires: 1 })
    }

    if (!cookies.get('userId')) {
      const id = uuidv4()

      cookies.set('userId', id, { expires: 365 })
      this.trackEvent('first_view', {
        ts: Date.now(),
        id
      })

      cookies.set('locationTracked', true, { expires: 1 })
      this.trackEvent('location', { ...userDataByIp })
    }
  }

  /**
   * Get Number of Users
   */
  public async getNumberOfUsers() {
    const response = await axios.get(
      `${GENESYSGO_URL}/${this.project.shdw}/analytics.list-user_view.json`
    )

    if (!response.data) {
      return {
        daily: 0,
        weekly: 0,
        monthly: 0
      }
    }

    const daily = response.data.filter(
      (event: { ts: number }) =>
        event.ts > Date.now() - 24 * 60 * 60 * 1000 && event.ts < Date.now()
    ).length

    const weekly = response.data.filter(
      (event: { ts: number }) =>
        event.ts > Date.now() - 7 * 24 * 60 * 60 * 1000 && event.ts < Date.now()
    ).length

    const monthly = response.data.filter(
      (event: { ts: number }) =>
        event.ts > Date.now() - 30 * 24 * 60 * 60 * 1000 &&
        event.ts < Date.now()
    ).length

    return {
      daily: Number(daily || 0),
      weekly: Number(weekly || 0),
      monthly: Number(monthly || 0)
    }
  }

  /**
   * Get Statistics
   */
  public async getStatistics() {
    const viewsResponse = await axios.get(
      `${GENESYSGO_URL}/${this.project.shdw}/analytics.list-page_view.json`
    )

    const usersResponse = await axios.get(
      `${GENESYSGO_URL}/${this.project.shdw}/analytics.list-user_view.json`
    )

    return {
      users: Number(usersResponse?.data?.length || 0),
      views: Number(viewsResponse?.data?.length || 0)
    }
  }

  /**
   * Get Events
   */
  public async getAllEvents() {
    const listObjects = await this.shdwDrive.listObjects(
      new PublicKey(this.project.shdw)
    )

    const events = listObjects.keys.filter((item) =>
      item.includes('analytics.list-')
    )

    const response = await Promise.all(
      events.map(async (event) => {
        const eventResponse = await axios.get(
          `${GENESYSGO_URL}/${this.project.shdw}/${event}`
        )

        return eventResponse.data
      })
    )

    return response
  }

  /**
   * Track Event
   * @param event Name of the event
   * @param params Parameters of the event (e.g. { id: 1 })
   */
  public async trackEvent(name: string, params: { [key: string]: any }) {
    shadowVerifyAccount(this.shdwDrive, this.project.shdw)

    const response = await axios.get(
      `${GENESYSGO_URL}/${this.project.shdw}/analytics.list-${name}.json`
    )

    if (!response.data) {
      const eventListFile = new File(
        [JSON.stringify([])],
        `analytics.list-${name}.json`,
        {
          type: 'application/json'
        }
      )

      this.shdwDrive.uploadFile(new PublicKey(this.project.shdw), eventListFile)
    }

    const id = uuidv4()
    const eventFile = new File(
      [JSON.stringify(params)],
      `analytics.list-${name}.${id}.json`,
      {
        type: 'application/json'
      }
    )

    await this.shdwDrive.uploadFile(new PublicKey(this.project.shdw), eventFile)

    const newEventListFile = new File(
      [JSON.stringify([...response.data, { id, ts: Date.now() }])],
      `analytics.list-${name}.json`,
      {
        type: 'application/json'
      }
    )

    await this.shdwDrive.editFile(
      new PublicKey(this.project.shdw),
      `${GENESYSGO_URL}/${this.project.shdw}/analytics.list-${name}.json`,
      newEventListFile
    )
  }
}
