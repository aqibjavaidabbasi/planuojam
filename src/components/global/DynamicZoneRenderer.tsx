import { DynamicBlocks } from '@/types/pagesTypes'
import React from 'react'
import HeroBanner from '../Dynamic/HeroBanner'
import CardsGroup from './CardsGroup';
import BackgroundImageBlock from './BackgroundImageBlock';
import CityList from './CityList';

function DynamicZoneRenderer({ blocks }: { blocks: DynamicBlocks[] }) {

    return (
        <div>
            {
                blocks.map(singleBlock => {
                    const key = `${singleBlock.__component}-${Math.random()}`;
                    switch (singleBlock.__component) {
                        case 'dynamic-blocks.hero-banner': {
                            return <HeroBanner key={key} data={singleBlock} />
                        }
                        case 'general.location': {
                            return <div key={key}>Location component</div>
                        }
                        case 'dynamic-blocks.video-embed': {
                            return <div key={key}>video embed component</div>
                        }
                        case 'dynamic-blocks.text-image-block': {
                            return <div key={key}>Text Image block</div>
                        }
                        case 'dynamic-blocks.testimonials': {
                            return <div key={key}>Testimonials component</div>
                        }
                        case 'dynamic-blocks.pricing-table': {
                            return <div key={key}>Pricing Table component</div>
                        }
                        case 'dynamic-blocks.html-block': {
                            return <div key={key}>HTML BLOCK component</div>
                        }
                        case 'dynamic-blocks.faqs': {
                            return <div key={key}>FAQ Block</div>
                        }
                        case 'dynamic-blocks.call-to-action': {
                            return <div key={key}>call to action</div>
                        }
                        case 'dynamic-blocks.image-blocks-group': {
                            return <CardsGroup key={key} data={singleBlock} />
                        }
                        case 'general.city-list': {
                            return <CityList key={key} data={singleBlock} />
                        }
                        case 'typography.heading': {
                            return <div key={key}>a heading component</div>
                        }
                        case 'dynamic-blocks.image-block': {
                            return <div key={key}>image block with background</div>
                        }
                        case 'dynamic-blocks.block-groups': {
                            return <BackgroundImageBlock key={key} data={singleBlock} />
                        }
                        case 'general.title-description': {
                            return <div key={key}>title with description</div>
                        }
                        case 'general.social-links-component': {
                            return <div key={key}>social links component</div>
                        }
                        default: {
                            return null;
                        }
                    }
                })
            }
        </div>
    )
}

export default DynamicZoneRenderer